var db;
var version = 1;
var editEvent;

window.onload = function() {
    var contactList = document.getElementById('contact-list');
    var form = document.getElementById('form');
    var formTitle = document.getElementById('form-title');
    var formButton = document.getElementById('form-button');

    var sortable = Sortable.create(contactList, { handle: '.my-handle' });

    // Try to open database
    var request = window.indexedDB.open('address-book', version);

    request.onerror = function(event) {
        alert('The database could not be created.');
    }

    request.onsuccess = function(event) {
        db = request.result;
        display();
    }

    request.onupgradeneeded = function(event) {
        var db = event.target.result;

        // Create initial object store to store the name, phone and email of each contact
        var contactStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
        contactStore.createIndex = ('name', 'name', { unique: false });
        contactStore.createIndex = ('phone', 'phone', { unique: true });
        contactStore.createIndex = ('email', 'email', { unique: true });
    }

    form.onsubmit = function(event) {
        if(formButton.textContent === 'Add contact') {
            addContact(event);
        } else {
            saveEdited(event);
        }
    }

    function addContact(event) {
        // Stop page refresh after form submission
        event.preventDefault();

        // Get new contact data from form
        var newContact = { name: form.elements['name'].value, phone: form.elements['phone'].value, email: form.elements['email'].value };

        // Access the object store
        var transaction = db.transaction(['contacts'], 'readwrite');
        var contactStore = transaction.objectStore('contacts');
        var request = contactStore.add(newContact);

        request.onsuccess = function() {
            // Clear the form
            formValues('', '', '');
        };

        transaction.oncomplete = function() {
            display();
        };
    }

    function display() {
        // Clear current list
        while (contactList.firstChild) {
            contactList.removeChild(contactList.firstChild);
        }

        // Get object store cursor
        var contactStore = db.transaction('contacts').objectStore('contacts');
        contactStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;

            if(cursor) {
                // Put each contact into the contact list
                var contact = document.createElement('li');
                var span = document.createElement('span'); // For Sortable list handle
                var name = document.createElement('h3');
                var phone = document.createElement('p');
                var email = document.createElement('p');

                span.classList.add('my-handle')
                span.textContent = '::';
                name.textContent = cursor.value.name;
                phone.textContent = cursor.value.phone;
                email.textContent = cursor.value.email;

                contact.setAttribute('contact-id', cursor.value.id);
                contact.appendChild(span);
                contact.appendChild(name);
                contact.appendChild(phone);
                contact.appendChild(email);
                contactList.appendChild(contact);

                // Create delete contact button
                var ediButton = document.createElement('button');
                contact.appendChild(ediButton);
                ediButton.textContent = 'Edit';
                ediButton.onclick = editContact;

                // Create delete contact button
                var delButton = document.createElement('button');
                contact.appendChild(delButton);
                delButton.textContent = 'Delete';
                delButton.onclick = deleteContact;

                cursor.continue();
            } else {
                checkEmpty();
            }
        };
    }

    function editContact(event) {
        formTitle.textContent = 'Edit the contact';
        formButton.textContent = 'Update contact';

        var contactId = Number(event.target.parentNode.getAttribute('contact-id'));

        var transaction = db.transaction(['contacts'], 'readwrite');
        var contactStore = transaction.objectStore('contacts');
        var request = contactStore.get(contactId);

        request.onsuccess = function(event) {
            var data = event.target.result;

            // Fill the form with current values
            formValues(data.name, data.phone, data.email);
        };

        editEvent = event;
    }

    function saveEdited(event) {
        // Stop page refresh after form submission
        event.preventDefault();

        var contactId = Number(editEvent.target.parentNode.getAttribute('contact-id'));

        var transaction = db.transaction(['contacts'], 'readwrite');
        var contactStore = transaction.objectStore('contacts');
        var request = contactStore.get(contactId);

        request.onsuccess = function(event) {
            var data = event.target.result;

            data.name = form.elements['name'].value;
            data.phone = form.elements['phone'].value;
            data.email = form.elements['email'].value;

            var update = contactStore.put(data);

            update.onsuccess = function() {
                // Clear the form
                formValues('', '', '');
            };

            transaction.oncomplete = function() {
                display();
            };
        };

        formTitle.textContent = 'Add a new contact';
        formButton.textContent = 'Add contact';
    }

    function deleteContact(event) {
        var contactId = Number(event.target.parentNode.getAttribute('contact-id'));

        var transaction = db.transaction(['contacts'], 'readwrite');
        var contactStore = transaction.objectStore('contacts');
        var request = contactStore.delete(contactId);

        transaction.oncomplete = function() {
            // Remove contact (parent of button) from contact list (parent of contact)
            event.target.parentNode.parentNode.removeChild(event.target.parentNode);
            checkEmpty();
        };
    }

    function formValues(name, phone, email) {
        form.elements['name'].value = name;
        form.elements['phone'].value = phone;
        form.elements['email'].value = email;
    }

    function checkEmpty() {
        // Display message if there are no contacts
        if(!contactList.firstChild) {
            var message = document.createElement('li');
            message.textContent = 'No contacts found';
            contactList.appendChild(message);
        }
    }
}
