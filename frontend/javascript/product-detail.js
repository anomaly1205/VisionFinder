// Product Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeProductDetail();
});

function initializeProductDetail() {
    // Initialize color selection
    initializeColorSelection();
    
    // Initialize size selection
    initializeSizeSelection();
    
    // Initialize related products slider
    initializeRelatedProductsSlider();
    
    // Initialize product description toggle
    initializeDescriptionToggle();
    
    // Initialize add to cart functionality
    initializeAddToCart();
}

// Color Selection
function initializeColorSelection() {
    const colorOptions = document.querySelectorAll('.color-option');
    const selectedColorText = document.querySelector('.selected-color');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            colorOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update selected color text
            const colorName = this.getAttribute('data-color');
            selectedColorText.textContent = colorName;
            
            // You can add logic here to change the main product image based on color
            // changeMainImageByColor(colorName);
        });
    });
}

// Size Selection
function initializeSizeSelection() {
    const sizeOptions = document.querySelectorAll('.size-option');
    const selectedSizeText = document.querySelector('.selected-size');
    
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update selected size text
            const sizeName = this.getAttribute('data-size');
            selectedSizeText.textContent = sizeName;
        });
    });
}

// Change Main Image
function changeMainImage(thumbnail) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    // Remove active class from all thumbnails
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    
    // Add active class to clicked thumbnail
    thumbnail.classList.add('active');
    
    // Change main image source
    mainImage.src = thumbnail.src;
    mainImage.alt = thumbnail.alt;
}

// Quantity Controls
function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity-input');
    let currentValue = parseInt(quantityInput.value);
    let newValue = currentValue + change;
    
    // Ensure minimum quantity is 1
    if (newValue < 1) {
        newValue = 1;
    }
    
    // You can set a maximum quantity limit here if needed
    // if (newValue > 10) newValue = 10;
    
    quantityInput.value = newValue;
}

// Description Toggle
function initializeDescriptionToggle() {
    const toggleButton = document.querySelector('.description-toggle');
    const content = document.getElementById('description-content');
    const icon = toggleButton.querySelector('i');
    
    if (toggleButton && content) {
        toggleButton.addEventListener('click', function() {
            content.classList.toggle('active');
            
            // Rotate arrow icon
            if (content.classList.contains('active')) {
                icon.style.transform = 'rotate(180deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        });
    }
}

function toggleDescription() {
    const content = document.getElementById('description-content');
    const toggleButton = document.querySelector('.description-toggle');
    const icon = toggleButton.querySelector('i');
    
    content.classList.toggle('active');
    
    // Rotate arrow icon
    if (content.classList.contains('active')) {
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
}

// Add to Cart Functionality
function initializeAddToCart() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            // Get selected options
            const selectedColor = document.querySelector('.color-option.active')?.getAttribute('data-color');
            const selectedSize = document.querySelector('.size-option.active')?.getAttribute('data-size');
            const quantity = parseInt(document.getElementById('quantity-input').value);
            
            // Validate selections
            if (!selectedColor) {
                alert('Please select a color');
                return;
            }
            
            if (!selectedSize) {
                alert('Please select a size');
                return;
            }
            
            // Create product object
            const product = {
                id: 'ultra-shorts-7inch', // You should generate unique IDs for each product
                name: 'Quần Thể Thao Nam 7" Ultra Shorts',
                price: 189000,
                color: selectedColor,
                size: selectedSize,
                quantity: quantity,
                image: document.getElementById('main-product-image').src
            };
            
            // Add to cart (you'll need to implement cart functionality)
            addToCart(product);
            
            // Show success message
            showAddToCartSuccess();
        });
    }
}

// Add to Cart Function (to be integrated with cart system)
function addToCart(product) {
    // Get existing cart from localStorage or initialize empty cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product with same specifications already exists
    const existingProductIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.color === product.color && 
        item.size === product.size
    );
    
    if (existingProductIndex !== -1) {
        // Update quantity if product exists
        cart[existingProductIndex].quantity += product.quantity;
    } else {
        // Add new product to cart
        cart.push(product);
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count in header
    updateCartCount();
    
    console.log('Product added to cart:', product);
    console.log('Updated cart:', cart);
}

// Update Cart Count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Show Add to Cart Success Message
function showAddToCartSuccess() {
    // Create and show a temporary success message
    const successMessage = document.createElement('div');
    successMessage.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
            <i class="fa fa-check-circle"></i>
            Product added to cart!
        </div>
    `;
    
    document.body.appendChild(successMessage);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        document.body.removeChild(successMessage);
    }, 3000);
}

// Initialize Related Products Slider
function initializeRelatedProductsSlider() {
    // Initialize Slick slider for related products if needed
    if (typeof $ !== 'undefined' && $('.product-slider').length) {
        $('.product-slider').slick({
            dots: false,
            infinite: true,
            speed: 300,
            slidesToShow: 4,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 3000,
            prevArrow: '<div class="slick-prev"><i class="fa fa-chevron-left"></i></div>',
            nextArrow: '<div class="slick-next"><i class="fa fa-chevron-right"></i></div>',
            responsive: [
                {
                    breakpoint: 1024,
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
                    breakpoint: 480,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        });
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});

// Share Product Function
function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: document.querySelector('.product-title').textContent,
            text: 'Xem sản phẩm này trên Coolmate',
            url: window.location.href
        });
    } else {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Product link copied!');
        });
    }
}

// Add event listener for share button
document.addEventListener('DOMContentLoaded', function() {
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareProduct);
    }
});

// Smooth scroll to top when clicking breadcrumb home
document.addEventListener('DOMContentLoaded', function() {
    const homeLink = document.querySelector('.breadcrumb a[href="/home.html"]');
    if (homeLink) {
        homeLink.addEventListener('click', function(e) {
            // You can add smooth scroll behavior here if needed
        });
    }
});

// Image zoom functionality (optional enhancement)
function initializeImageZoom() {
    const mainImage = document.getElementById('main-product-image');
    
    if (mainImage) {
        mainImage.addEventListener('click', function() {
            // Create modal for image zoom
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    cursor: pointer;
                ">
                    <img src="${this.src}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close modal on click
            modal.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
    }
}

// Initialize image zoom
document.addEventListener('DOMContentLoaded', function() {
    initializeImageZoom();
});
