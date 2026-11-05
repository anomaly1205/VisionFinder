// Shopping Cart Management System - Unified and Fixed Version
class ShoppingCart {
  constructor() {
    this.items = {}; // Use object for better performance with unique keys
    this.loadCartFromStorage();
    this.initEventListeners();
    this.updateCartUI();
  }

  // Generate unique key for cart items
  getItemKey(productId, size) {
    return `${productId}_${size}`;
  }

  // Load cart data from localStorage
  loadCartFromStorage() {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
      try {
        const parsedData = JSON.parse(savedCart);
        this.items = parsedData.items || {};
      } catch (e) {
        console.error('Error parsing cart data:', e);
        this.items = {};
      }
    }
  }

  // Save cart data to localStorage
  saveCartToStorage() {
    const cartData = {
      items: this.items,
      timestamp: Date.now()
    };
    localStorage.setItem('shoppingCart', JSON.stringify(cartData));
    
    // Trigger storage event for cross-page sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'shoppingCart',
      newValue: JSON.stringify(cartData)
    }));
  }

  // Add item to cart
  addItem(productId, name, price, image, size, quantity = 1, currency = 'VND') {
    const itemKey = this.getItemKey(productId, size);
    
    if (this.items[itemKey]) {
      this.items[itemKey].quantity += quantity;
      // Ensure currency flag stays in sync
      this.items[itemKey].currency = currency;
      // Keep latest name/image/price in case product detail changed
      this.items[itemKey].name = name;
      this.items[itemKey].image = image;
      this.items[itemKey].price = price;
    } else {
      this.items[itemKey] = {
        id: productId,
        name: name,
        price: price,
        image: image,
        size: size,
        quantity: quantity,
        currency: currency // 'VND' or 'USD' (display currency)
      };
    }

    this.saveCartToStorage();
    this.updateCartUI();
    this.showToast(`Added "${name}" to cart`, 'success');
  }

  // Remove item from cart
  removeItem(productId, size) {
    const itemKey = this.getItemKey(productId, size);
    delete this.items[itemKey];
    this.saveCartToStorage();
    this.updateCartUI();
  }

  // Update item quantity
  updateQuantity(productId, size, newQuantity) {
    const itemKey = this.getItemKey(productId, size);
    
    if (this.items[itemKey]) {
      if (newQuantity <= 0) {
        this.removeItem(productId, size);
      } else {
        this.items[itemKey].quantity = newQuantity;
        this.saveCartToStorage();
        this.updateCartUI();
      }
    }
  }

  // Get total items count
  getTotalItemCount() {
    return Object.values(this.items).reduce((total, item) => total + item.quantity, 0);
  }

  // Get total price
  getTotalPrice() {
    return Object.values(this.items).reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get items as array (for compatibility)
  getItemsArray() {
    return Object.values(this.items);
  }

  // Update cart UI
  updateCartUI() {
    this.updateCartBadge();
    this.updateMiniCartContent();
  }

  // Update cart badge
  updateCartBadge() {
    const cartBadge = document.querySelector('.badge') || document.getElementById('cart-count');
    const totalItems = this.getTotalItemCount();
    
    if (cartBadge) {
      cartBadge.textContent = totalItems;
      cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
      
      // Animation for badge
      cartBadge.style.animation = 'none';
      setTimeout(() => {
        cartBadge.style.animation = 'badge-pop 0.3s ease';
      }, 10);
    }
  }

  // Update mini cart content
  updateMiniCartContent() {
    const miniCartContent = document.getElementById('mini-cart-content');
    if (!miniCartContent) return;

    const totalItems = this.getTotalItemCount();

    if (totalItems === 0) {
      miniCartContent.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="empty-cart-text">Your cart is empty</div>
          <div class="empty-cart-subtext">Add products to start shopping</div>
        </div>
      `;
      return;
    }

    // Generate items HTML
    let itemsHTML = '';
    const EX_RATE = 24000;
    function formatVND(n){return n.toLocaleString('vi-VN') + '₫';}
    function formatUSD(n){
      const r = Math.round(n * 100) / 100;
      if (Math.abs(r - Math.round(r)) < 0.005) return Math.round(r) + '$';
      return r.toFixed(2) + '$';
    }

    Object.values(this.items).forEach(item => {
      const itemTotalVND = item.price * item.quantity; // base stored in VND
      const isUSD = item.currency === 'USD';
      const displayUnitPrice = isUSD ? (item.price / EX_RATE) : item.price;
      const displayTotal = isUSD ? (itemTotalVND / EX_RATE) : itemTotalVND;
      itemsHTML += `
        <div class="mini-cart-item" data-product-id="${item.id}" data-size="${item.size}">
          <div class="item-image">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='Image/placeholder.jpg'">
          </div>
          <div class="item-details">
            <div class="item-name">${item.name}</div>
            <div class="item-price-quantity">
              <div class="item-price">${isUSD ? formatUSD(displayTotal) : formatVND(displayTotal)}</div>
              <div class="quantity-controls">
                <button onclick="shoppingCart.updateQuantity('${item.id}', '${item.size}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'style="opacity:0.5"' : ''}>-</button>
                <span class="qty-display">${item.quantity}</span>
                <button onclick="shoppingCart.updateQuantity('${item.id}', '${item.size}', ${item.quantity + 1})">+</button>
              </div>
            </div>
          </div>
          <button class="remove-item" onclick="shoppingCart.removeItem('${item.id}', '${item.size}')" title="Remove item">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    });

    miniCartContent.innerHTML = `
      <div class="mini-cart-header">
        <h3>Cart (${totalItems})</h3>
        <a href="shoppingcart.html" class="view-all-link">View all</a>
      </div>
      <div class="mini-cart-items">
        ${itemsHTML}
      </div>
      <div class="mini-cart-footer">
        <button class="view-cart-btn" onclick="window.location.href='shoppingcart.html'">
          <i class="fas fa-shopping-cart"></i>
          View cart
        </button>
      </div>
    `;
  }

  // Show toast notification
  showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Show toast with animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }

  // Initialize event listeners
  initEventListeners() {
    // Cart container hover events
    const cartContainer = document.querySelector('.cart-container');
    if (cartContainer) {
      cartContainer.addEventListener('mouseenter', () => {
        const miniCart = document.getElementById('mini-cart');
        if (miniCart) {
          miniCart.classList.add('show');
        }
      });

      cartContainer.addEventListener('mouseleave', () => {
        const miniCart = document.getElementById('mini-cart');
        if (miniCart) {
          miniCart.classList.remove('show');
        }
      });
    }

    // Listen for storage changes to sync across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'shoppingCart') {
        this.loadCartFromStorage();
        this.updateCartUI();
      }
    });
  }

  // Clear all items from cart
  clearCart() {
    this.items = {};
    this.saveCartToStorage();
    this.updateCartUI();
  }
}

// Utility functions for quantity controls
function increaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  if (quantityInput) {
    let currentValue = parseInt(quantityInput.value) || 1;
    const maxValue = 10;
    if (currentValue < maxValue) {
      quantityInput.value = currentValue + 1;
    }
  }
}

function decreaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  if (quantityInput) {
    let currentValue = parseInt(quantityInput.value) || 1;
    if (currentValue > 1) {
      quantityInput.value = currentValue - 1;
    }
  }
}

// Add to cart functions for different pages
function addToCartFromMenu(productCard) {
  const productId = productCard.dataset.productId || 'menu-' + Date.now();
  const productName = productCard.querySelector('.product-title')?.textContent || 'Sản phẩm';
  const productPriceText = productCard.querySelector('.product-price')?.textContent || '0₫';
  const productImage = productCard.querySelector('.product-image')?.src || 'Image/placeholder.jpg';
  // Detect currency and parse
  const isUSD = /\$/.test(productPriceText);
  const EX_RATE = 24000;
  let priceVND = 0;
  if (isUSD){
    const usdMatch = productPriceText.match(/(\d+(?:[.,]\d+)?)\s*\$/);
    const usd = usdMatch ? parseFloat(usdMatch[1].replace(',', '.')) : 0;
    priceVND = Math.round(usd * EX_RATE);
  } else {
    priceVND = parseInt(productPriceText.replace(/[^\d]/g, '')) || 0;
  }

  shoppingCart.addItem(productId, productName, priceVND, productImage, 'M', 1, isUSD ? 'USD' : 'VND');
}

function addToCartFromBoloc(productCard) {
  const productId = productCard.dataset.productId || 'boloc-' + Date.now();
  const productName = productCard.querySelector('.product-title')?.textContent || 'Sản phẩm';
  const productPriceText = productCard.querySelector('.product-price')?.textContent || '0₫';
  const productImage = productCard.querySelector('.product-image')?.src || 'Image/placeholder.jpg';
  // Detect currency and parse
  const isUSD = /\$/.test(productPriceText);
  const EX_RATE = 24000;
  let priceVND = 0;
  if (isUSD){
    const usdMatch = productPriceText.match(/(\d+(?:[.,]\d+)?)\s*\$/);
    const usd = usdMatch ? parseFloat(usdMatch[1].replace(',', '.')) : 0;
    priceVND = Math.round(usd * EX_RATE);
  } else {
    priceVND = parseInt(productPriceText.replace(/[^\d]/g, '')) || 0;
  }
  
  shoppingCart.addItem(productId, productName, priceVND, productImage, 'M', 1, isUSD ? 'USD' : 'VND');
}

// Global cart instance
let shoppingCart;

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  shoppingCart = new ShoppingCart();
  
  // Make globally available for compatibility
  window.shoppingCart = shoppingCart;
  window.cart = shoppingCart; // Legacy support
});
