function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

function login() {
    var userEmail = document.getElementById("uname").value;
    var userPass = document.getElementById("psw").value;

    if (!userEmail) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Email is required.',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
        return;
    }

    if (!isValidEmail(userEmail)) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter a valid email address.',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
        return;
    }

    firebase.auth().signInWithEmailAndPassword(userEmail, userPass)
    .then((userCredential) => {
        var userId = userCredential.user.uid;
        console.log("User ID:", userId); // Debugging
        return firebase.database().ref('users/' + userId).once('value');
    })
    .then((snapshot) => {
        var userData = snapshot.val();
        console.log("User Data:", userData); // Debugging
        if (!userData) {
            throw new Error("No user data available.");
        }
        if (userData.role === "admin") {
            console.log("User is admin"); // Debugging
            window.location.href = '/views/dashboard/index.html';
            return;
        } else if (userData.role === "user") {
            var now = new Date();
            var expiryDate = userData.expiryDate ? new Date(userData.expiryDate) : null;
            if (expiryDate && now > expiryDate) {
                throw new Error("Account has expired.");
            }
            console.log("User is regular user"); // Debugging
            window.location.href = '/views/user';
            return;
        } else {
            throw new Error("Invalid user role.");
        }
    })
    .catch((error) => {
        let errorMessage = "An error occurred. Please try again.";
        if (error.code === 'auth/wrong-password') {
            errorMessage = "Incorrect password. Please try again.";
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = "No user found with this email.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email address.";
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
    });
}

function resetPassword() {
    var auth = firebase.auth();
    var emailAddress = document.getElementById("uname").value;

    if (!isValidEmail(emailAddress)) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please enter a valid email address.',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
        return;
    }

    auth.sendPasswordResetEmail(emailAddress).then(function() {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Reset password email sent!',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
    }).catch(function(error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('psw');

    togglePassword.addEventListener('click', function() {
        // Toggle the type attribute
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);

        // Toggle the icon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});
