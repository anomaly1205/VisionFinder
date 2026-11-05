// Size Options Functionality for boloc.html
document.addEventListener('DOMContentLoaded', function() {
    // Handle size option clicks
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function(event) {
            event.stopPropagation();
            const siblings = this.parentNode.querySelectorAll('.size-option');
            siblings.forEach(sibling => sibling.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // --- Bộ lọc loại sản phẩm cho nu.html ---
    const typeCheckboxes = document.querySelectorAll('input[type="checkbox"][name="type"]');
    const productCards = document.querySelectorAll('.product-listing .product-card');

    if (typeCheckboxes.length && productCards.length) {
        typeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Lấy tất cả các loại được chọn
                const checkedTypes = Array.from(typeCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                productCards.forEach(card => {
                    const cardType = card.getAttribute('data-type');
                    // Nếu không chọn gì, hiện tất cả
                    if (checkedTypes.length === 0) {
                        card.style.display = '';
                    } else {
                        // Nếu loại của card nằm trong checkedTypes thì hiện, không thì ẩn
                        if (checkedTypes.includes(cardType)) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
    }
});
