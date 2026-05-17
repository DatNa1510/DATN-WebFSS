package vn.fss.auth.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.fss.auth.dto.AddressDto;
import vn.fss.auth.entity.User;
import vn.fss.auth.entity.UserAddress;
import vn.fss.auth.repository.UserAddressRepository;
import vn.fss.auth.repository.UserRepository;
import vn.fss.notification.service.NotificationService;
import vn.fss.notification.model.Notification;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<AddressDto> getUserAddresses(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user)
                .stream().map(AddressDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public AddressDto addAddress(String email, AddressDto dto) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        List<UserAddress> existing = addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user);
        boolean isFirst = existing.isEmpty();
        boolean shouldBeDefault = isFirst || (dto.getIsDefault() != null && dto.getIsDefault());

        if (shouldBeDefault && !isFirst) {
            existing.forEach(a -> {
                if (a.getIsDefault()) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            });
        }

        UserAddress address = UserAddress.builder()
                .user(user)
                .recipientName(dto.getRecipientName())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .district(dto.getDistrict())
                .city(dto.getCity())
                .isDefault(shouldBeDefault)
                .build();

        UserAddress saved = addressRepository.save(address);
        notificationService.createNotification(
            user, 
            "Địa chỉ mới", 
            "Bạn vừa thêm một địa chỉ giao hàng mới: " + dto.getAddress(), 
            Notification.NotificationType.SUCCESS
        );

        return AddressDto.fromEntity(saved);
    }

    @Transactional
    public AddressDto updateAddress(String email, Long id, AddressDto dto) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        UserAddress address = addressRepository.findById(id).orElseThrow(() -> new RuntimeException("Address not found"));
        
        if (!address.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        address.setRecipientName(dto.getRecipientName());
        address.setPhone(dto.getPhone());
        address.setAddress(dto.getAddress());
        address.setDistrict(dto.getDistrict());
        address.setCity(dto.getCity());

        if (dto.getIsDefault() != null && dto.getIsDefault() && !address.getIsDefault()) {
            List<UserAddress> existing = addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user);
            existing.forEach(a -> {
                if (a.getIsDefault() && !a.getId().equals(id)) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            });
            address.setIsDefault(true);
        }

        UserAddress saved = addressRepository.save(address);
        notificationService.createNotification(
            user, 
            "Cập nhật địa chỉ", 
            "Địa chỉ '" + dto.getRecipientName() + "' đã được cập nhật thành công.", 
            Notification.NotificationType.INFO
        );

        return AddressDto.fromEntity(saved);
    }

    @Transactional
    public void deleteAddress(String email, Long id) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        UserAddress address = addressRepository.findById(id).orElseThrow(() -> new RuntimeException("Address not found"));
        
        if (!address.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        boolean wasDefault = address.getIsDefault();
        addressRepository.delete(address);
        notificationService.createNotification(
            user, 
            "Xóa địa chỉ", 
            "Địa chỉ '" + address.getRecipientName() + "' đã bị xóa khỏi sổ địa chỉ.", 
            Notification.NotificationType.WARNING
        );

        if (wasDefault) {
            List<UserAddress> remaining = addressRepository.findByUserOrderByIsDefaultDescCreatedAtDesc(user);
            if (!remaining.isEmpty()) {
                UserAddress newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }
}
