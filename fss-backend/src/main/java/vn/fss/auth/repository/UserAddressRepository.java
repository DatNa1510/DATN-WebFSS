package vn.fss.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.fss.auth.entity.User;
import vn.fss.auth.entity.UserAddress;

import java.util.List;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUserOrderByIsDefaultDescCreatedAtDesc(User user);
    List<UserAddress> findByUserAndIsDefaultTrue(User user);
}
