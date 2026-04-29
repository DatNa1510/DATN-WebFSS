package vn.fss.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.fss.auth.entity.UserAddress;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private Long id;
    private String recipientName;
    private String phone;
    private String address;
    private String district;
    private String city;
    private Boolean isDefault;

    public static AddressDto fromEntity(UserAddress entity) {
        return AddressDto.builder()
                .id(entity.getId())
                .recipientName(entity.getRecipientName())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .district(entity.getDistrict())
                .city(entity.getCity())
                .isDefault(entity.getIsDefault())
                .build();
    }
}
