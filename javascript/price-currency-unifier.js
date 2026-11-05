// Unify currency display on list pages: convert $ to VND
(function(){
  const exchangeRate = 24000; // 1 USD = 24,000 VND (site convention)

  function formatVND(vnd){
    if(typeof vnd !== 'number' || isNaN(vnd)) return '';
    return vnd.toLocaleString('vi-VN') + 'đ';
  }

  function convertDollarTextToVND(text){
    if(!text) return null;
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*\$/);
    if(!match) return null;
    const usd = parseFloat(match[1].replace(',', '.'));
    const vnd = Math.round(usd * exchangeRate);
    return formatVND(vnd);
  }

  function processPrices(root){
    const priceEls = root.querySelectorAll('.product-card .product-price .price-sale');
    priceEls.forEach(el => {
      const vndText = convertDollarTextToVND(el.textContent.trim());
      if(vndText){
        el.textContent = vndText;
        el.setAttribute('data-currency', 'VND');
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ processPrices(document); });
  }else{
    processPrices(document);
  }
})();
