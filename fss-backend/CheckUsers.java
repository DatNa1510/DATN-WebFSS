import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;

public class CheckUsers {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/fss_db";
        String user = "postgres";
        String password = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM cart_items LIMIT 1")) {
            
            ResultSetMetaData rsmd = rs.getMetaData();
            int columnCount = rsmd.getColumnCount();
            System.out.println("=== CART ITEMS COLUMNS ===");
            for (int i = 1; i <= columnCount; i++ ) {
              String name = rsmd.getColumnName(i);
              System.out.println(name);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
