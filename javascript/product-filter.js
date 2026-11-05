// Product Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const btnDecor = document.getElementById('btn-decor');
    const btnLifestyle = document.getElementById('btn-lifestyle');
    const btnStorage = document.getElementById('btn-storage');
    const productsDecor = document.getElementById('products-decor');
    const productsLifestyle = document.getElementById('products-lifestyle');
    const productsStorage = document.getElementById('products-storage');
    if (!btnDecor || !btnLifestyle || !btnStorage || !productsDecor || !productsLifestyle || !productsStorage) return;

    // Function to switch between men and women products
    function switchToDecor() {
        // Update button states
        btnDecor.classList.add('active');
        btnLifestyle.classList.remove('active');
        btnStorage.classList.remove('active');
        
        // Show/hide product sections
        productsDecor.classList.remove('hidden');
        productsLifestyle.classList.add('hidden');
        productsStorage.classList.add('hidden');
    }

    function switchToLifestyle() {
        // Update button states
        btnLifestyle.classList.add('active');
        btnDecor.classList.remove('active');
        btnStorage.classList.remove('active');
        
        // Show/hide product sections
        productsLifestyle.classList.remove('hidden');
        productsDecor.classList.add('hidden');
        productsStorage.classList.add('hidden');

    
    }

    function switchToStorage() {
        // Update button states
        btnStorage.classList.add('active');
        btnDecor.classList.remove('active');
        btnLifestyle.classList.remove('active');
        
        // Show/hide product sections
        productsLifestyle.classList.add('hidden');
        productsDecor.classList.add('hidden');
        productsStorage.classList.remove('hidden');

    
    }

    // Event listeners
    btnDecor.addEventListener('click', switchToDecor);
    btnLifestyle.addEventListener('click', switchToLifestyle);
    btnStorage.addEventListener('click', switchToStorage);

    // Initialize with decor products shown by default
    switchToDecor();
});
