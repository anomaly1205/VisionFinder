$(document).ready(function() {
    // Khởi tạo slick carousel cho product slider
    // Chỉ init khi có slider và chưa init (tránh lỗi initADA của slick)
    var $sliders = $('.product-slider').not('.slick-initialized').filter(function() {
        return $(this).children().length > 0;
    });
    if ($sliders.length) $sliders.slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        autoplay: false,
        dots: false,
        arrows: true,
        infinite: true,
        variableWidth: false,
        adaptiveHeight: false,
        responsive: [
            {
                breakpoint: 1400,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 1200,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 576,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    // Xử lý click vào size options
    $(document).on('click', '.size-option', function() {
        // Remove active class from siblings
        $(this).siblings('.size-option').removeClass('active');
        // Add active class to clicked element
        $(this).addClass('active');
    });

    // Hover effect cho product cards
    $('.product-card').hover(
        function() {
            $(this).addClass('hovered');
        },
        function() {
            $(this).removeClass('hovered');
        }
    );
});
