// Checkout page functionality - syncs with shoppingCart
class CheckoutManager {
  constructor() {
    this.items = {};
    this.appliedDiscountVND = 0; // persist discount applied
    this.init();
  }

  init() {
    // Load cart data immediately
    this.loadCartFromStorage();
    this.displayCartItems();
    this.updateTotals();
    
    // Listen for storage changes (when items are added from other pages)
    window.addEventListener('storage', (e) => {
      if (e.key === 'shoppingCart') {
        this.loadCartFromStorage();
        this.displayCartItems();
        this.updateTotals();
      }
    });

    // Also check for updates periodically
    // Throttle periodic sync to reduce overhead
    setInterval(() => {
      const currentData = JSON.stringify(this.items);
      this.loadCartFromStorage();
      const newData = JSON.stringify(this.items);
      if (currentData !== newData) {
        this.displayCartItems();
        this.updateTotals();
      }
    }, 1500); // Check every 1.5s for changes
  }

  // Load cart data from localStorage
  loadCartFromStorage() {
    const cartData = localStorage.getItem('shoppingCart');
    if (cartData) {
      try {
        const parsedData = JSON.parse(cartData);
        this.items = parsedData.items || {};
      } catch (e) {
        console.error('Error parsing cart data:', e);
        this.items = {};
      }
    } else {
      this.items = {};
    }
  }

  // Display cart items in checkout
  displayCartItems() {
    const cartContainer = document.getElementById('checkout-cart-items');
    if (!cartContainer) return;

    const itemValues = Object.values(this.items);
    
    if (itemValues.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart-checkout">
          <div class="empty-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <p>Your cart is empty</p>
          <a href="home.html" class="continue-shopping">Continue shopping</a>
        </div>
      `;
      return;
    }

    const EX_RATE = 24000;
    function formatVND(n){return n.toLocaleString('vi-VN') + 'đ';}
    function formatUSD(n){
      const r = Math.round(n * 100) / 100;
      if (Math.abs(r - Math.round(r)) < 0.005) return Math.round(r) + '$';
      return r.toFixed(2) + '$';
    }

    let cartHTML = '';
    itemValues.forEach(item => {
      const itemTotalVND = item.price * item.quantity; // base in VND
      const isUSD = item.currency === 'USD';
      const displayUnit = isUSD ? formatUSD(item.price / EX_RATE) : formatVND(item.price);
      const displayTotal = isUSD ? formatUSD(itemTotalVND / EX_RATE) : formatVND(itemTotalVND);
      cartHTML += `
        <div class="checkout-cart-item" data-product-id="${item.id}" data-size="${item.size}">
          <div class="item-image">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='Image/placeholder.jpg'">
          </div>
          <div class="item-details">
            <h4 class="item-name">${item.name}</h4>
            <div class="item-price-quantity">
              <span class="item-price">${displayUnit}</span>
              <div class="quantity-controls">
                <button class="qty-btn" onclick="checkoutManager.updateQuantity('${item.id}', '${item.size}', ${item.quantity - 1})">-</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="checkoutManager.updateQuantity('${item.id}', '${item.size}', ${item.quantity + 1})">+</button>
              </div>
              <div class="item-total">${displayTotal}</div>
            </div>
          </div>
          <button class="remove-item" onclick="checkoutManager.removeItem('${item.id}', '${item.size}')" title="Remove item">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    });

    cartContainer.innerHTML = cartHTML;
  }
  // Update item quantity
  updateQuantity(productId, size, newQuantity) {
    const itemKey = `${productId}_${size}`;
    
    if (newQuantity <= 0) {
      this.removeItem(productId, size);
      return;
    }
    
    if (this.items[itemKey]) {
      this.items[itemKey].quantity = newQuantity;
      this.saveCartToStorage();
      this.displayCartItems();
      this.updateTotals();
    }
  }

  // Remove item from cart
  removeItem(productId, size) {
    const itemKey = `${productId}_${size}`;
    delete this.items[itemKey];
    
    this.saveCartToStorage();
    this.displayCartItems();
    this.updateTotals();
  }

  // Save cart to localStorage
  saveCartToStorage() {
    const cartData = {
      items: this.items,
      timestamp: Date.now()
    };
    localStorage.setItem('shoppingCart', JSON.stringify(cartData));
    
    // Trigger storage event for other pages
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'shoppingCart',
      newValue: JSON.stringify(cartData)
    }));
  }

  // Calculate totals
  getTotalItems() {
    return Object.values(this.items).reduce((total, item) => total + item.quantity, 0);
  }

  getSubtotal() {
    return Object.values(this.items).reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Update totals display
  updateTotals() {
    const EX_RATE = 24000;
    const itemsArr = Object.values(this.items);
    const vndSubtotal = itemsArr.filter(i => i.currency !== 'USD').reduce((t, i) => t + (i.price * i.quantity), 0);
    const usdSubtotal = itemsArr.filter(i => i.currency === 'USD').reduce((t, i) => t + (i.price * i.quantity), 0) / EX_RATE;
    const discount = Math.max(Number(this.appliedDiscountVND || window.checkoutDiscountVND || 0), 0); // Voucher applied to VND only
    const totalVND = Math.max(vndSubtotal - discount, 0);
    const totalUSD = usdSubtotal;

    const formatUSD = (n) => {
      const r = Math.round(n * 100) / 100;
      return Number.isInteger(r) ? `${Math.round(r)}$` : `${r.toFixed(2)}$`;
    };

    // Update subtotal
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
      if (usdSubtotal > 0 && vndSubtotal > 0) {
        subtotalElement.textContent = `${vndSubtotal.toLocaleString('vi-VN')}đ + ${formatUSD(usdSubtotal)}`;
      } else if (usdSubtotal > 0) {
        subtotalElement.textContent = formatUSD(usdSubtotal);
      } else {
        subtotalElement.textContent = `${vndSubtotal.toLocaleString('vi-VN')}đ`;
      }
    }

    // Update discount
    const discountElement = document.getElementById('discount');
    if (discountElement) {
      discountElement.textContent = `${discount.toLocaleString('vi-VN')}đ`;
    }

    // Update total
    const totalElement = document.getElementById('total');
    if (totalElement) {
      if (usdSubtotal > 0 && totalVND > 0) {
        totalElement.textContent = `${totalVND.toLocaleString('vi-VN')}đ + ${formatUSD(totalUSD)}`;
      } else if (usdSubtotal > 0) {
        totalElement.textContent = formatUSD(totalUSD);
      } else {
        totalElement.textContent = `${totalVND.toLocaleString('vi-VN')}đ`;
      }
    }

    // Update bottom total
    const totalBottomElement = document.getElementById('total-bottom');
    if (totalBottomElement) {
      if (usdSubtotal > 0 && totalVND > 0) {
        totalBottomElement.textContent = `${totalVND.toLocaleString('vi-VN')}đ + ${formatUSD(totalUSD)}`;
      } else if (usdSubtotal > 0) {
        totalBottomElement.textContent = formatUSD(totalUSD);
      } else {
        totalBottomElement.textContent = `${totalVND.toLocaleString('vi-VN')}đ`;
      }
    }
  }

  // Clear entire cart
  clearCart() {
    this.items = {};
    this.saveCartToStorage();
    this.displayCartItems();
    this.updateTotals();
  }
}

// Voucher functionality
function applyVoucher() {
  const voucherCode = document.getElementById('voucher-code').value.trim();
  
  if (!voucherCode) {
    alert('Please enter a voucher code!');
    return;
  }

  // Mock voucher validation
  const validVouchers = {
    'NEWUSER10': { discount: 0.1, description: '10% off for new customers' },
    'SAVE20K': { discount: 20000, description: 'Save 20,000₫' },
    'SUMMER25': { discount: 0.25, description: '25% off summer sale' }
  };

  const voucher = validVouchers[voucherCode.toUpperCase()];
  
  if (voucher) {
    const subtotal = checkoutManager.getSubtotal();
    let discountAmount;
    
    if (voucher.discount < 1) {
      // Percentage discount
      discountAmount = subtotal * voucher.discount;
    } else {
      // Fixed amount discount
      discountAmount = Math.min(voucher.discount, subtotal);
    }

    // Persist discount and refresh totals via manager
    if (typeof checkoutManager !== 'undefined') {
      checkoutManager.appliedDiscountVND = discountAmount;
      checkoutManager.updateTotals();
    } else {
      window.checkoutDiscountVND = discountAmount;
    }

    alert(`Voucher applied: ${voucher.description}`);
    document.getElementById('voucher-code').value = '';
  } else {
    alert('Invalid voucher code!');
  }
}

// Place order functionality
function placeOrder() {
  const cartItems = Object.values(checkoutManager.items);
  
  if (cartItems.length === 0) {
    alert('Cart is empty! Please add products before placing an order.');
    return;
  }

  // Mock order placement
  const orderId = 'CM' + Date.now().toString().slice(-8);
  
  // Clear cart after successful order
  const shoppingCartInstance = window.shoppingCart || new ShoppingCart();
  shoppingCartInstance.clearCart();
  
  alert(`Order placed successfully!\nOrder ID: ${orderId}\nThank you for shopping with us!`);
  
  // Redirect to success page or home
  window.location.href = 'home.html';
}

// Initialize checkout manager when page loads
let checkoutManager;
document.addEventListener('DOMContentLoaded', function() {
  checkoutManager = new CheckoutManager();
  // Bind button events (clean: avoid inline handlers)
  const applyBtn = document.getElementById('apply-voucher-btn');
  if (applyBtn) applyBtn.addEventListener('click', applyVoucher);

  const placeBtn = document.getElementById('place-order-btn');
  if (placeBtn) placeBtn.addEventListener('click', placeOrder);

  // Payment method selection: update summary bar and highlight card
  const methodSummary = document.querySelector('.fixed-order-bar .method-summary');
  const cards = document.querySelectorAll('.payment-card input[type="radio"]');
  const methodConfig = {
    COD: { html: '<i class="fa fa-truck"></i> Cash on Delivery' },
    ZALOPAY: { html: '<img src="/Image/Logo/ZALO.png" width="18" alt="ZaloPay"> ZaloPay' },
    APPLEPAY: { html: '<i class="fa-brands fa-apple"></i> Apple Pay' },
    MOMO: { html: '<img src="/Image/Logo/MOMO.webp" width="18" alt="MoMo"> MoMo' },
    VNPAY: { html: '<img src="/Image/Logo/VNPAY.webp" width="18" alt="VNPAY"> VNPAY' }
  };

  function setMethodSummary(key) {
    if (!methodSummary) return;
    const methodHtml = methodConfig[key] ? methodConfig[key].html : '';
    methodSummary.innerHTML = `${methodHtml} <span class="divider">|</span> <i class="fa fa-percent"></i> Voucher`;
  }

  cards.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-card').forEach(card => card.classList.remove('selected'));
      const card = radio.closest('.payment-card');
      if (card) card.classList.add('selected');
      setMethodSummary(radio.value);
    });
  });

  // Initialize summary from default checked radio
  const initial = document.querySelector('.payment-card input[type="radio"]:checked');
  if (initial) setMethodSummary(initial.value);

  // Prefix dropdown for name combo
  const combo = document.querySelector('[data-component="prefix-combo"]');
  if (combo) {
    const btn = combo.querySelector('.prefix-button');
    const list = combo.querySelector('.prefix-options');
    const selectedSpan = combo.querySelector('.prefix-button .selected');
    btn?.addEventListener('click', () => {
      const open = combo.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    list?.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      selectedSpan.textContent = li.dataset.value || li.textContent.trim();
      combo.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', (e) => {
      if (!combo.contains(e.target)) {
        combo.classList.remove('open');
        btn?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Toggle panels: other recipient & VAT
  function bindToggle(toggleId, panelSelector) {
    const cb = document.getElementById(toggleId);
    const panel = document.querySelector(panelSelector);
    if (!cb || !panel) return;
    const set = () => {
      if (cb.checked) panel.classList.add('open');
      else panel.classList.remove('open');
    };
    set();
    cb.addEventListener('change', set);
  }

  bindToggle('other-recipient-toggle', '.recipient-panel');
  bindToggle('vat-toggle', '.vat-panel');
});
