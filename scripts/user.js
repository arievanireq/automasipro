// Definisikan fungsi logout di ruang lingkup global
function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '../../';
    }).catch((error) => {
        alert("Error : " + error.message);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Pastikan semua elemen sudah dimuat
    function showSection(sectionId) {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        const navLinks = document.querySelectorAll('.nav a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === '#' + sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function showSidebarContent(contentId) {
        const contentSections = document.querySelectorAll('.content_section');
        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        const targetContent = document.getElementById(contentId);
        if (targetContent) {
            targetContent.style.display = 'block';
        }

        const sidebarLinks = document.querySelectorAll('.sidebar a');
        sidebarLinks.forEach(link => {
            if (link.getAttribute('href') === '#' + contentId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const contentId = link.getAttribute('href').substring(1);
            showSidebarContent(contentId);
        });
    });

    function fetchAndDisplayUserData() {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const uid = user.uid;
                const userRef = firebase.database().ref('users/' + uid);
                userRef.once('value', (snapshot) => {
                    const userData = snapshot.val();
                    if (userData) {
                        document.querySelector('.nama_profile').textContent = userData.name || 'Tidak tersedia';
                        document.querySelector('.email_profile').textContent = userData.email || 'Tidak tersedia';
                        document.querySelector('.telepon_profile').textContent = userData.phone || 'Tidak tersedia';
                    }
                }).catch((error) => {
                    console.error("Error fetching user data:", error);
                });
            } else {
                console.log("Tidak ada pengguna yang login.");
            }
        });
    }

    fetchAndDisplayUserData();

    const formUbahPassword = document.getElementById('formUbahPassword');
    if (formUbahPassword) {
        formUbahPassword.addEventListener('submit', function(event) {
            event.preventDefault();
            const passwordLama = document.getElementById('passwordLama');
            const passwordBaru = document.getElementById('passwordBaru');

            const user = firebase.auth().currentUser;
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email, 
                passwordLama.value
            );

            // Re-authenticate user
            user.reauthenticateWithCredential(credential).then(() => {
                // User re-authenticated.
                user.updatePassword(passwordBaru.value).then(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: 'Password berhasil diubah',
                        customClass: {
                            confirmButton: 'swal2-confirm', // Class untuk tombol konfirmasi
                            cancelButton: 'swal2-cancel' // Class untuk tombol batal
                        },
                        buttonsStyling: false // Nonaktifkan styling default SweetAlert untuk tombol
                    });
                    // Kosongkan input
                    passwordLama.value = '';
                    passwordBaru.value = '';
                }).catch((error) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal!',
                        text: 'Gagal mengubah password: ' + error.message,
                        customClass: {
                            confirmButton: 'swal2-confirm',
                            cancelButton: 'swal2-cancel'
                        },
                        buttonsStyling: false
                    });
                });
            }).catch((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Autentikasi Gagal!',
                    text: 'Autentikasi gagal: ' + error.message,
                    customClass: {
                        confirmButton: 'swal2-confirm',
                        cancelButton: 'swal2-cancel'
                    },
                    buttonsStyling: false
                });
            });
        });
    }

    const togglePasswordLama = document.getElementById('togglePasswordLama');
    const passwordLama = document.getElementById('passwordLama');
    togglePasswordLama.addEventListener('click', function() {
        const type = passwordLama.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordLama.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    const togglePasswordBaru = document.getElementById('togglePasswordBaru');
    const passwordBaru = document.getElementById('passwordBaru');
    togglePasswordBaru.addEventListener('click', function() {
        const type = passwordBaru.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordBaru.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
});
