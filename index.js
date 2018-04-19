var db;
var version = 1;
var editEvent;

// person/organisation, scroll

window.onload = function() {
    var contactList = document.getElementById('contact-list');
    var personForm = document.getElementById('person-form');
    var personFormTitle = document.getElementById('person-form-title');
    var personFormButton = document.getElementById('person-form-button');
    var orgForm = document.getElementById('org-form');
    var orgFormTitle = document.getElementById('org-form-title');
    var orgFormButton = document.getElementById('org-form-button');

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

        // Create initial object store to store the name, phone and email of each person
        var contactStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
        contactStore.createIndex = ('name', 'name', { unique: false });
        contactStore.createIndex = ('phone', 'phone', { unique: true });
        contactStore.createIndex = ('email', 'email', { unique: true });
        contactStore.createIndex = ('org', 'org', { unique: false });
        var orgStore = db.createObjectStore('orgs', { keyPath: 'id', autoIncrement: true });
        orgStore.createIndex = ('name', 'name', { unique: true });
        orgStore.createIndex = ('phone', 'phone', { unique: true });
        orgStore.createIndex = ('email', 'email', { unique: true });
    }

    personForm.onsubmit = function(event) {
        if(personFormButton.textContent === 'Add contact') {
            addContact(event);
        } else {
            saveEdited(event);
        }
    }

    orgForm.onsubmit = function(event) {
        if(orgFormButton.textContent === 'Add organisation') {
            addOrg(event);
        } else {
            saveEditedOrg(event);
        }
    }

    function addContact(event) {
        // Stop page refresh after form submission
        event.preventDefault();

        // Get new contact data from form
        var newContact = { name: personForm.elements['name'].value, phone: personForm.elements['phone'].value, email: personForm.elements['email'].value, org: personForm.elements['org'].value };

        // Access the object store
        var transaction = db.transaction(['contacts'], 'readwrite');
        var contactStore = transaction.objectStore('contacts');
        var request = contactStore.add(newContact);

        request.onsuccess = function() {
            // Clear the form
            formValues('personForm', '', '', '', '');
        };

        transaction.oncomplete = function() {
            display();
        };
    }

    function addOrg(event) {
        // Stop page refresh after form submission
        event.preventDefault();

        // Get new contact data from form
        var newOrg = { name: orgForm.elements['name'].value, phone: orgForm.elements['phone'].value, email: orgForm.elements['email'].value };

        // Access the object store
        var transaction = db.transaction(['org'], 'readwrite');
        var orgStore = transaction.objectStore('org');
        var request = orgStore.add(newOrg);

        request.onsuccess = function() {
            // Clear the form
            formValues('orgForm', '', '', '', '');
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
            console.log(cursor);

            if(cursor) {
                console.log(cursor);
                // Put each contact into the contact list
                var contact = document.createElement('li');
                var name = document.createElement('p');
                var phone = document.createElement('p');
                var email = document.createElement('p');
                var org = document.createElement('p');

                name.textContent = cursor.value.name;
                phone.textContent = cursor.value.phone;
                email.textContent = cursor.value.email;
                org.textContent = cursor.value.org;

                name.setAttribute('class', 'name');
                phone.setAttribute('class', 'phone');
                email.setAttribute('class', 'email');
                org.setAttribute('class', 'org');
                contact.setAttribute('contact-id', cursor.value.id);

                contact.appendChild(name);
                contact.appendChild(phone);
                contact.appendChild(email);
                contact.appendChild(org);
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
        personFormTitle.textContent = 'Edit the contact';
        personFormButton.textContent = 'Update contact';

        var contactId = Number(event.target.parentNode.getAttribute('contact-id'));

        var transaction = db.transaction(['contacts'], 'readwrite');
        var contactStore = transaction.objectStore('contacts');
        var request = contactStore.get(contactId);

        request.onsuccess = function(event) {
            var data = event.target.result;

            // Fill the form with current values
            formValues('personForm', data.name, data.phone, data.email, data.org);
        };

        editEvent = event;
    }

    function editOrg(event) {
        orgFormTitle.textContent = 'Edit the organisation';
        orgFormButton.textContent = 'Update organisation';

        var orgId = Number(event.target.parentNode.getAttribute('contact-id'));

        var transaction = db.transaction(['orgs'], 'readwrite');
        var orgStore = transaction.objectStore('orgs');
        var request = orgStore.get(orgId);

        request.onsuccess = function(event) {
            var data = event.target.result;

            // Fill the form with current values
            formValues('orgForm', data.name, data.phone, data.email, '');
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

            data.name = personForm.elements['name'].value;
            data.phone = personForm.elements['phone'].value;
            data.email = personForm.elements['email'].value;
            data.org = personForm.elements['org'].value;

            var update = contactStore.put(data);

            update.onsuccess = function() {
                // Clear the form
                formValues('personForm', '', '', '', '');
            };

            transaction.oncomplete = function() {
                display();
            };
        };

        personFormTitle.textContent = 'Add a new contact';
        personFormButton.textContent = 'Add contact';
    }

    function saveEditedOrg(event) {
        // Stop page refresh after form submission
        event.preventDefault();

        var orgId = Number(editEvent.target.parentNode.getAttribute('contact-id'));

        var transaction = db.transaction(['orgs'], 'readwrite');
        var orgStore = transaction.objectStore('orgs');
        var request =orgStore.get(orgId);

        request.onsuccess = function(event) {
            var data = event.target.result;

            data.name = orgForm.elements['name'].value;
            data.phone = orgForm.elements['phone'].value;
            data.email = orgForm.elements['email'].value;

            var update = orgStore.put(data);

            update.onsuccess = function() {
                // Clear the form
                formValues('orgForm', '', '', '', '');
            };

            transaction.oncomplete = function() {
                display();
            };
        };

        orgFormTitle.textContent = 'Add a new organisation';
        orgFormButton.textContent = 'Add organisation';
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

    function formValues(form, name, phone, email, org) {
        if (form === 'personForm') {
            personForm.elements['name'].value = name;
            personForm.elements['phone'].value = phone;
            personForm.elements['email'].value = email;
            personForm.elements['org'].value = org;
        } else {
            orgForm.elements['name'].value = name;
            orgForm.elements['phone'].value = phone;
            orgForm.elements['email'].value = email;
        }
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
