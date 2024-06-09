function logout() {
    firebase.auth().signOut().then(() => {
        window.location.href = '/index.html';
    }).catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    });
}

function registerUser() {
    var email = document.getElementById("newEmail").value;
    var password = document.getElementById("newPassword").value;
    var name = document.getElementById("newName").value;
    var phone = document.getElementById("newPhone").value;
    var duration = document.getElementById("duration").value;

    var expiryDate = calculateExpiryDate(duration);
    var isActive = true; // Set status as active initially

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        var userId = userCredential.user.uid;
        firebase.database().ref('users/' + userId).set({
            name: name,
            email: email,
            phone: phone,
            expiryDate: expiryDate,
            isActive: isActive,
            role: "user"
        });
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'User registered successfully!',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
        document.getElementById("registerForm").reset();
    })
    .catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    });
}

function calculateExpiryDate(duration) {
    var now = new Date();
    switch (duration) {
        case '5m': now.setMinutes(now.getMinutes() + 5); break;
        case '7d': now.setDate(now.getDate() + 7); break;
        case '1M': now.setMonth(now.getMonth() + 1); break;
        case '3M': now.setMonth(now.getMonth() + 3); break;
        case '6M': now.setMonth(now.getMonth() + 6); break;
        case '1Y': now.setFullYear(now.getFullYear() + 1); break;
    }
    return now.toISOString();
}

function searchUsers() {
    var input = document.getElementById("searchUser");
    var filter = input.value.toLowerCase();
    var table = document.getElementById("userList");
    var tr = table.getElementsByTagName("tr");

    for (var i = 0; i < tr.length; i++) {
        var td = tr[i].getElementsByTagName("td")[0]; // Mengasumsikan kolom email adalah kolom pertama
        if (td) {
            var txtValue = td.textContent || td.innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }       
    }
}

function fetchUsers() {
    var usersRef = firebase.database().ref('users');
    usersRef.on('value', function(snapshot) {
        var users = snapshot.val();
        var userListHtml = '';
        var totalUsers = 0;
        for (var userId in users) {
            var user = users[userId];
            var currentDate = new Date();
            var expiryDate = new Date(user.expiryDate);
            var isActive = expiryDate > currentDate;

            if (user.role === 'user') {
                totalUsers++;
                var status = isActive ? 'enabled' : 'disabled';
                var actionButton = isActive ? 
                    '<button class="disable" onclick="disableUser(\'' + userId + '\')" disabled>Disable</button>' : 
                    '<button class="enable" onclick="enableUser(\'' + userId + '\')">Enable</button>';
                
                userListHtml += '<tr id="user' + userId + '">' +
                    '<td>' + user.email + '</td>' +
                    '<td>' + user.name + '</td>' +
                    '<td>' + user.phone + '</td>' +
                    '<td>' + status + '</td>' +
                    '<td>' + expiryDate.toLocaleDateString() + '</td>' +
                    '<td class="action-buttons">' + actionButton + 
                    '<button class="delete" onclick="deleteUser(\'' + userId + '\')">Hapus</button></td>' +
                    '</tr>';
            }
        }
        var userListElement = document.getElementById('userList');
        var totalUsersElement = document.getElementById('totalUsers');
        if (userListElement) {
            userListElement.innerHTML = userListHtml;
            totalUsersElement.textContent = totalUsers;
        } else {
            console.warn('Element with id "userList" not found.');
        }
    });
}

function deleteUser(userId) {
    var userRef = firebase.database().ref('users/' + userId);
    userRef.remove()
    .then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'User deleted successfully.',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
    })
    .catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error deleting user: ' + error.message
        });
    });
}

function enableUser(userId) {
    Swal.fire({
        title: 'Pilih Durasi Baru',
        html: `
            <select id="newDuration" class="swal2-select">
                <option value="5m">5 Minutes</option>
                <option value="7d">7 Days</option>
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="1Y">1 Year</option>
            </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'Enable',
        cancelButtonText: 'Batal',
        preConfirm: () => {
            const duration = Swal.getPopup().querySelector('#newDuration').value;
            if (!duration) {
                Swal.showValidationMessage(`Please select a duration`);
            }
            return { duration: duration };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const duration = result.value.duration;
            updateUserDuration(userId, duration);
        }
    });
}

function updateUserDuration(userId, duration) {
    var expiryDate = calculateExpiryDate(duration);
    var userRef = firebase.database().ref('users/' + userId);
    userRef.update({
        isActive: true,
        expiryDate: expiryDate
    })
    .then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'User reactivated successfully.',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
        fetchUsers(); // Refresh the user list
    })
    .catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error reactivating user: ' + error.message
        });
    });
}

function createArticle() {
    var title = document.getElementById("articleTitle").value;
    var content = document.getElementById("articleContent").value;
    var video = document.getElementById("articleVideo").value;
    var author = firebase.auth().currentUser.email;
    var createdAt = new Date().toISOString();

    var newArticleKey = firebase.database().ref().child('articles').push().key;

    var articleData = {
        title: title,
        content: content,
        video: video,
        author: author,
        createdAt: createdAt
    };

    var updates = {};
    updates['/articles/' + newArticleKey] = articleData;

    firebase.database().ref().update(updates)
    .then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Article created successfully!',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
        document.getElementById("createArticleForm").reset();
    })
    .catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
    });
}

function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}

function fetchArticles() {
    var articleList = document.getElementById('articleList');
    articleList.innerHTML = ''; // Clear the list before fetching

    firebase.database().ref('articles').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var article = childSnapshot.val();
            var row = document.createElement('tr');

            var titleCell = document.createElement('td');
            titleCell.textContent = truncateText(article.title, 20); // Truncate title to 20 characters
            row.appendChild(titleCell);

            var contentCell = document.createElement('td');
            contentCell.textContent = truncateText(article.content, 50); // Truncate content to 50 characters
            row.appendChild(contentCell);

            var videoCell = document.createElement('td');
            videoCell.textContent = truncateText(article.video, 30); // Truncate video link to 30 characters
            row.appendChild(videoCell);

            var authorCell = document.createElement('td');
            authorCell.textContent = article.author;
            row.appendChild(authorCell);

            var createdAtCell = document.createElement('td');
            createdAtCell.textContent = new Date(article.createdAt).toLocaleString();
            row.appendChild(createdAtCell);

            var actionCell = document.createElement('td');
            actionCell.classList.add('action-buttons');
            var editButton = document.createElement('button');
            editButton.classList.add('edit');
            editButton.textContent = 'Edit';
            // Add edit functionality here
            actionCell.appendChild(editButton);

            var deleteButton = document.createElement('button');
            deleteButton.classList.add('delete');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = function() {
                deleteArticle(childSnapshot.key);
            };
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);

            articleList.appendChild(row);
        });
    });
}

function deleteArticle(articleId) {
    firebase.database().ref('articles/' + articleId).remove()
    .then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Article deleted successfully.',
            customClass: {
                confirmButton: 'swal2-confirm'
            }
        });
        fetchArticles(); // Refresh the article list
    })
    .catch((error) => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error deleting article: ' + error.message
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const sections = document.querySelectorAll('.dashboard_content, .register_content, .user_list_content, .create_article_content, .list_article_content');
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });

            if (targetId === 'list_article_content') {
                fetchArticles();
            }
        });
    });
    fetchUsers(); // Memuat daftar pengguna

    var dropdown = document.querySelector('.dropdown-toggle');
    dropdown.addEventListener('click', function(event) {
        var dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === 'block') {
            dropdownContent.style.display = 'none';
        } else {
            dropdownContent.style.display = 'block';
        }
    });
});

