package vn.fss.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusStatsDto {
    private long pending;
    private long confirmed;
    private long shipping;
    private long delivered;
    private long cancelled;
}
