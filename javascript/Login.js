const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

// -------------------Sau này sẽ xóa sau-------------------
// Redirect to home.html when the Sign In form is submitted
document.addEventListener('DOMContentLoaded', () => {
	const signInForm = document.querySelector('.sign-in-container form');
	if (signInForm) {
		signInForm.addEventListener('submit', (e) => {
			e.preventDefault();
			window.location.href = 'home.html';
		});
	}
});
