/**
 * sizeGuideData.js
 * Tiêu chuẩn số đo người Việt cho các danh mục sản phẩm
 */

export const SIZE_GUIDES = {
  Apparel: {
    Men: {
      title: 'Bảng size Quần áo Nam',
      headers: ['Size', 'Chiều cao (cm)', 'Cân nặng (kg)', 'Vòng ngực (cm)'],
      rows: [
        ['S', '160 - 165', '50 - 55', '84 - 88'],
        ['M', '165 - 170', '56 - 65', '88 - 92'],
        ['L', '170 - 175', '66 - 75', '92 - 96'],
        ['XL', '175 - 180', '76 - 85', '96 - 100'],
        ['XXL', '180 - 185', '86 - 95', '100 - 104'],
      ],
      note: 'Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn nếu muốn mặc thoải mái.'
    },
    Women: {
      title: 'Bảng size Quần áo Nữ',
      headers: ['Size', 'Chiều cao (cm)', 'Cân nặng (kg)', 'Vòng ngực (cm)'],
      rows: [
        ['S', '150 - 155', '40 - 47', '78 - 82'],
        ['M', '155 - 160', '48 - 54', '82 - 86'],
        ['L', '160 - 165', '55 - 60', '86 - 90'],
        ['XL', '165 - 170', '61 - 65', '90 - 94'],
        ['XXL', '170 - 175', '66 - 70', '94 - 98'],
      ],
      note: 'Thông số chỉ mang tính chất tham khảo, có thể thay đổi tùy theo chất liệu vải.'
    }
  },
  Footwear: {
    Men: {
      title: 'Bảng size Giày Nam',
      headers: ['Size VN/EU', 'Chiều dài chân (cm)', 'Size US', 'Size UK'],
      rows: [
        ['38', '23.5', '6', '5.5'],
        ['39', '24.5', '7', '6.5'],
        ['40', '25.0', '7.5', '7'],
        ['41', '26.0', '8.5', '8'],
        ['42', '27.0', '9.5', '9'],
        ['43', '28.0', '10.5', '10'],
        ['44', '29.0', '11.5', '11'],
      ],
      note: 'Nên đo chân vào cuối ngày khi chân đạt kích thước lớn nhất.'
    },
    Women: {
      title: 'Bảng size Giày Nữ',
      headers: ['Size VN/EU', 'Chiều dài chân (cm)', 'Size US', 'Size UK'],
      rows: [
        ['35', '22.0', '5', '3'],
        ['36', '22.5', '6', '4'],
        ['37', '23.5', '7', '5'],
        ['38', '24.5', '8', '6'],
        ['39', '25.0', '8.5', '6.5'],
        ['40', '25.5', '9', '7'],
      ],
      note: 'Nếu mu bàn chân dày hoặc chân bè, hãy cân nhắc tăng thêm 1 size.'
    }
  },
  Accessories: {
    Men: {
      title: 'Thông tin kích cỡ Phụ kiện Nam',
      headers: ['Loại', 'Kích thước'],
      rows: [
        ['Thắt lưng', '95cm - 125cm'],
        ['Ví', 'Dạng gập / Đứng'],
        ['Túi xách', 'Free size'],
        ['Đồng hồ', 'Mặt 38mm - 42mm'],
        ['Mũ', 'Vòng đầu 54cm - 60cm'],
      ],
      note: 'Đa số phụ kiện là Freesize hoặc có nấc điều chỉnh.'
    },
    Women: {
      title: 'Thông tin kích cỡ Phụ kiện Nữ',
      headers: ['Loại', 'Kích thước'],
      rows: [
        ['Thắt lưng', '75cm - 105cm'],
        ['Ví', 'Dạng gập / Cầm tay'],
        ['Túi xách', 'Free size'],
        ['Trang sức', 'Có thể điều chỉnh'],
        ['Mũ', 'Vòng đầu 52cm - 58cm'],
      ],
      note: 'Phụ kiện thường được thiết kế để phù hợp với nhiều dáng người.'
    }
  }
};

export const getSizeGuide = (category, gender) => {
  // Normalize category
  let cat = 'Apparel';
  if (category === 'Footwear' || category === 'Giày dép') cat = 'Footwear';
  if (category === 'Accessories' || category === 'Phụ kiện') cat = 'Accessories';
  
  // Normalize gender
  let gen = 'Men';
  if (gender === 'Women' || gender === 'Nữ' || gender === 'Girls' || gender === 'Bé gái') gen = 'Women';
  
  return SIZE_GUIDES[cat]?.[gen] || SIZE_GUIDES.Apparel.Men;
};
