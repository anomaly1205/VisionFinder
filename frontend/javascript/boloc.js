// Bộ lọc sản phẩm cho boloc.html
document.addEventListener('DOMContentLoaded', function() {
    // Lấy tất cả các sản phẩm
    const products = document.querySelectorAll('.product-card');
    
    // Lấy tất cả các checkbox bộ lọc
    const usageFilters = document.querySelectorAll('input[name="usage"]');
    const genderFilters = document.querySelectorAll('input[name="gender"]');
    const priceFilters = document.querySelectorAll('input[name="price"]');
    
    // Hàm kiểm tra xem sản phẩm có thỏa mãn bộ lọc không
    function checkProductMatch(product, selectedUsage, selectedGender, selectedPrice) {
        const productUsage = product.getAttribute('data-usage');
        const productGender = product.getAttribute('data-gender');
        const productPrice = parseInt(product.getAttribute('data-price'));
        
        // Kiểm tra bộ lọc "Phù hợp với"
        let usageMatch = selectedUsage.length === 0 || selectedUsage.includes(productUsage);
        
        // Kiểm tra bộ lọc "Giới tính"
        let genderMatch = selectedGender.length === 0 || selectedGender.includes(productGender);
        
        // Kiểm tra bộ lọc "Giá"
        let priceMatch = true;
        if (selectedPrice.length > 0) {
            priceMatch = selectedPrice.some(priceRange => {
                if (priceRange === '0-200000') {
                    return productPrice >= 0 && productPrice <= 200000;
                } else if (priceRange === '200000-300000') {
                    return productPrice > 200000 && productPrice <= 300000;
                } else if (priceRange === '300000-500000') {
                    return productPrice > 300000 && productPrice <= 500000;
                } else if (priceRange === '500000-9999999') {
                    return productPrice > 500000;
                }
                return false;
            });
        }
        
        return usageMatch && genderMatch && priceMatch;
    }
    
    // Hàm áp dụng bộ lọc
    function applyFilters() {
        // Lấy các giá trị được chọn
        const selectedUsage = Array.from(usageFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
            
        const selectedGender = Array.from(genderFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
            
        const selectedPrice = Array.from(priceFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        // Hiển thị/ẩn sản phẩm
        let visibleCount = 0;
        products.forEach(product => {
            if (checkProductMatch(product, selectedUsage, selectedGender, selectedPrice)) {
                product.style.display = 'block';
                visibleCount++;
            } else {
                product.style.display = 'none';
            }
        });
        
        // Cập nhật số lượng sản phẩm hiển thị
        updateProductCount(visibleCount);
        
        // Hiển thị thông báo nếu không có sản phẩm nào
        showNoResultsMessage(visibleCount === 0);
        
        // Log để debug (có thể xóa sau)
        console.log('Filters applied:', {
            usage: selectedUsage,
            gender: selectedGender,
            price: selectedPrice,
            visibleProducts: visibleCount
        });
    }
    
    // Hàm cập nhật số lượng sản phẩm
    function updateProductCount(count) {
        // Không hiển thị số lượng sản phẩm
        return;
    }
    
    // Hàm hiển thị thông báo không có kết quả
    function showNoResultsMessage(show) {
        let noResultsMsg = document.getElementById('no-results-message');
        
        if (show) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'no-results-message';
                noResultsMsg.className = 'no-results';
                noResultsMsg.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fa fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <h3>Không tìm thấy sản phẩm nào</h3>
                        <p>Please try changing filters to see more products</p>
                    </div>
                `;
                document.querySelector('.product-listing').appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else {
            if (noResultsMsg) {
                noResultsMsg.style.display = 'none';
            }
        }
    }
    
    // Hàm reset bộ lọc
    function resetFilters() {
        // Bỏ chọn tất cả checkbox
        [...usageFilters, ...genderFilters, ...priceFilters].forEach(cb => {
            cb.checked = false;
        });
        
        // Hiển thị tất cả sản phẩm
        products.forEach(product => {
            product.style.display = 'block';
        });
        
        // Ẩn thông báo không có kết quả
        showNoResultsMessage(false);
        
        // Cập nhật số lượng sản phẩm
        updateProductCount(products.length);
    }
    
    // Thêm event listener cho tất cả checkbox
    [...usageFilters, ...genderFilters, ...priceFilters].forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
    
    // Thêm nút reset (tuỳ chọn)
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Xóa tất cả bộ lọc';
        resetButton.className = 'reset-filters-btn';
        resetButton.style.cssText = `
            width: 100%;
            padding: 10px;
            background: gray;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            font-size: 14px;
            transition: background 0.3s ease;
        `;
        
        resetButton.addEventListener('mouseover', function() {
            this.style.background = '#d32f2f';
        });
        
        resetButton.addEventListener('mouseout', function() {
            this.style.background = '#f44336';
        });
        
        resetButton.addEventListener('click', resetFilters);
        sidebar.appendChild(resetButton);
    }
    
    // Thêm hiệu ứng loading khi lọc (tuỳ chọn)
    function addLoadingEffect() {
        const productListing = document.querySelector('.product-listing');
        productListing.style.opacity = '0.6';
        productListing.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
            productListing.style.opacity = '1';
        }, 200);
    }
    
    // Cập nhật hàm applyFilters để có hiệu ứng loading
    const originalApplyFilters = applyFilters;
    applyFilters = function() {
        addLoadingEffect();
        originalApplyFilters();
    };
    
    // Khởi tạo: hiển thị tất cả sản phẩm và số lượng
    updateProductCount(products.length);
    console.log('Bộ lọc đã được khởi tạo với', products.length, 'sản phẩm');
});
