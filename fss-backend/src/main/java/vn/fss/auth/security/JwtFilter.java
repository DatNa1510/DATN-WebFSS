package vn.fss.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.fss.auth.repository.UserRepository;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            if (jwtUtil.validateToken(jwt)) {
                userEmail = jwtUtil.extractEmail(jwt);

                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Trong production thực tế nên có 1 UserDetailsService để load
                    // Ở đây đơn giản load từ repository để kiểm tra và lấy Role
                    userRepository.findByEmail(userEmail).ifPresent(user -> {
                        if (user.getIsEnabled()) {
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
                            );
                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        }
                    });
                }
            }
        } catch (Exception e) {
            // Log error, continue filter chain meaning request remains unauthenticated
            logger.error("Cannot set user authentication: {}", e);
        }

        filterChain.doFilter(request, response);
    }
}
