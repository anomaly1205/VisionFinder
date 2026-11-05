// Script để cập nhật cấu trúc HTML cho tất cả product-card
$(document).ready(function() {
    // Tìm tất cả các product-card có sale-badge và img riêng biệt
    $('.product-card').each(function() {
        var $card = $(this);
        var $img = $card.find('img');
        var $badge = $card.find('.sale-badge');
        
        // Kiểm tra nếu chưa có product-image-container
        if ($img.parent().hasClass('product-image-container') === false) {
            // Tạo container mới
            var $container = $('<div class="product-image-container"></div>');
            
            // Di chuyển img vào container
            $img.appendTo($container);
            
            // Di chuyển badge vào container
            if ($badge.length > 0) {
                $badge.appendTo($container);
            }
            
            // Thêm container vào đầu product-card
            $card.prepend($container);
        }
    });
});
