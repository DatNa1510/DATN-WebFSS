package vn.fss.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.fss.auth.dto.AddressDto;
import vn.fss.auth.service.AddressService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<AddressDto>> getUserAddresses(Authentication auth) {
        return ResponseEntity.ok(addressService.getUserAddresses(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<AddressDto> addAddress(Authentication auth, @RequestBody AddressDto dto) {
        return ResponseEntity.ok(addressService.addAddress(auth.getName(), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressDto> updateAddress(Authentication auth, @PathVariable Long id, @RequestBody AddressDto dto) {
        return ResponseEntity.ok(addressService.updateAddress(auth.getName(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(Authentication auth, @PathVariable Long id) {
        addressService.deleteAddress(auth.getName(), id);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }
}
