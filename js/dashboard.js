var idCollector = document.querySelector(".id_collector");
var guide = document.querySelector(".guide");
var guideOpacity = guide ? guide.querySelector(".box_opacity") : null;
var guideClose = document.querySelector(".guide_close");
var guideOpen = document.querySelector(".guide_button");
var confirm = document.querySelector(".confirm");
var confirmOpacity = confirm ? confirm.querySelector(".box_opacity") : null;
var confirmYes = document.querySelector(".confirm_yes");
var confirmNo = document.querySelector(".confirm_no");
var boxOpened = "box_open";
var yourCards = document.querySelector(".ids");
var token = safeGetItem("activeToken");
var isAdmin = safeGetItem("isAdmin");
var limit = false;

var create = document.querySelector(".create");
if (create) {
    create.addEventListener("click", () => {
        navigateTo('generator');
    });
}

var admin = document.querySelector(".admin");
if (admin) {
    admin.style.display = "none";
    document.addEventListener('keydown', function(e) {
        if (e.shiftKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            admin.style.display = admin.style.display === 'none' ? "block" : "none";
            notify(admin.style.display === 'block' ? "Panel administratora odblokowany" : "Ukryto panel admina", "info");
        }
    });
    admin.addEventListener("click", () => navigateTo('admin'));
}

if (guideOpen) {
    guideOpen.addEventListener("click", () => { if (guide) guide.classList.add(boxOpened); });
}
if (guideClose) {
    guideClose.addEventListener("click", () => { if (guide) guide.classList.remove(boxOpened); });
}
if (guideOpacity) {
    guideOpacity.addEventListener("click", () => { if (guide) guide.classList.remove(boxOpened); });
}

function editDocument(index) {
    (async () => {
        const docs = await safeGetDocs();
        const doc = docs[index];
        if (!doc) { notify('Nie znaleziono dokumentu', 'error'); return; }
        safeSetItem('editingDocument', JSON.stringify({ index, data: doc }));
        window.location.href = 'generator.html';
    })();
}

function deleteDocument(index) {
    (async () => {
        const docs = await safeGetDocs();
        if (index < 0 || index >= docs.length) return;
        confirm.classList.add(boxOpened);
        const handleDelete = async () => {
            await safeDeleteDoc(index);
            confirm.classList.remove(boxOpened);
            notify('Dokument zosta\u0142 usuni\u0119ty', 'success');
            loadLocalDocuments();
            confirmYes.removeEventListener('click', handleDelete);
            confirmNo.removeEventListener('click', handleCancel);
        };
        const handleCancel = () => {
            confirm.classList.remove(boxOpened);
            confirmYes.removeEventListener('click', handleDelete);
            confirmNo.removeEventListener('click', handleCancel);
        };
        confirmYes.addEventListener('click', handleDelete);
        confirmNo.addEventListener('click', handleCancel);
        if (confirmOpacity) confirmOpacity.addEventListener('click', handleCancel);
    })();
}

function addDocumentToList(doc, index) {
    const template = `
        <div class="id" data-index="${index}">
            <p class="name">${doc.name || ''} ${doc.surname || ''}</p>
            <p class="data">PESEL <span class="data_highlight">${doc.pesel || ''}</span></p>
            <p class="data">Data urodzenia <span class="data_highlight">${doc.birthday || ''}</span></p>
            <div class="action_holder">
                <div class="action" onclick="window.open('card.html?id=${index}')">
                    <img class="action_image" src="assets/page/images/enter.png">
                    <p class="action_text">Wejd\u017a</p>
                </div>
                <div class="action" onclick="editDocument(${index})">
                    <img class="action_image" src="assets/page/images/edit.png">
                    <p class="action_text">Edytuj</p>
                </div>
                <div class="action" onclick="deleteDocument(${index})">
                    <img class="action_image" src="assets/page/images/delete.png">
                    <p class="action_text">Usu\u0144</p>
                </div>
            </div>
        </div>
    `;
    yourCards.innerHTML += template;
}

async function loadLocalDocuments() {
    const userDocs = await safeGetDocs();
    if (userDocs.length === 0) {
        let fallback = null;
        try { fallback = JSON.parse(safeGetItem('formData') || 'null'); } catch(e) {}
        if (!fallback) { try { fallback = JSON.parse(safeGetItem('cardData') || 'null'); } catch(e) {} }
        if (fallback) {
            yourCards.style.display = "block";
            if (idCollector) idCollector.style.display = 'block';
            idCollector.innerHTML = '';
            createLocalId(fallback, 0);
            return;
        }
        yourCards.style.display = "none";
        return;
    }
    yourCards.style.display = "block";
    if (idCollector) idCollector.style.display = 'block';
    idCollector.innerHTML = '';
    userDocs.forEach((doc, index) => {
        createLocalId(doc, index);
    });
}

if (confirmOpacity) {
    confirmOpacity.addEventListener("click", () => { if (confirm) confirm.classList.remove(boxOpened); });
}
if (confirmNo) {
    confirmNo.addEventListener("click", () => { if (confirm) confirm.classList.remove(boxOpened); });
}

if (confirmYes) {
    confirmYes.addEventListener("click", () => {
        (async () => {
            const activeToken = safeGetItem('activeToken') || 'default';
            const allDocsRaw = safeGetItem('dowody');
            let allDocs = {};
            try { allDocs = JSON.parse(allDocsRaw || '{}'); } catch(e) {}
            const userDocs = allDocs[activeToken] || [];
            if (userDocs[deleteing]) {
                userDocs.splice(deleteing, 1);
                allDocs[activeToken] = userDocs;
                safeSetItem('dowody', JSON.stringify(allDocs));
                loadLocalDocuments();
                notify("Dow\u00f3d zosta\u0142 usuni\u0119ty.", "success");
            }
            confirm.classList.remove(boxOpened);
        })();
    });
}

var template =
    '<div class="id_top">' +
    '<p class="number">Id: {id}</p>' +
    '<div class="copy" onclick="copy(\'{token}\')">' +
    '<p class="copy_text">Skopiuj url</p>' +
    '<img class="copy_image" src="assets/page/images/copy.svg">' +
    "</div>" +
    "</div>" +
    '<p class="data">Data urodzenia <span class="data_highlight">{date}</span></p>' +
    '<p class="data">Imi\u0119 <span class="data_highlight">{name}</span></p>' +
    '<p class="data">Nazwisko <span class="data_highlight">{surname}</span></p>' +
    '<div class="id_action">' +
    '<div class="delete" onclick="deleteId(\'local_{idIndex}\')">' +
    '<img class="delete_image" src="assets/page/images/delete_id.svg">' +
    "</div>" +
    '<p class="action_button" onclick="editId(\'local_{idIndex}\')">Edytuj</p>' +
    '<p class="action_button" onclick="enterId(\'{token}\')">Wejd\u017a</p>' +
    "</div>";

function copy(token) {
    notify("Url zosta\u0142 skopiowany.", "success");
    const idUrl = window.location.origin + '/' + pageMap['card'] + "?card_token=" + token;
    navigator.clipboard.writeText(idUrl);
}

function createIds(ids) {
    if (ids.length == 0) {
        yourCards.style.display = "none";
    } else {
        ids.forEach((id) => createId(id));
    }
}

function load(type) {
    if (!token && isAdmin === 'true') return;
    loadLocalDocuments();
}

var options = { year: "numeric", month: "2-digit", day: "2-digit" };

function createLocalId(doc, index) {
    if (!doc.cardToken) {
        doc.cardToken = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const activeToken = safeGetItem('activeToken') || 'default';
        const allDocsRaw = safeGetItem('dowody');
        let allDocs = {};
        try { allDocs = JSON.parse(allDocsRaw || '{}'); } catch(e) {}
        if (allDocs[activeToken]) {
            allDocs[activeToken][index] = doc;
            safeSetItem('dowody', JSON.stringify(allDocs));
        }
    }
    safeSetItem('lastDocumentToken', doc.cardToken);
    var temp = template;
    temp = temp.replaceAll("{id}", index + 1);
    temp = temp.replaceAll("{idIndex}", index);
    temp = temp.replaceAll("{name}", htmlEncode((doc.name || '').toUpperCase()));
    temp = temp.replaceAll("{surname}", htmlEncode((doc.surname || '').toUpperCase()));
    temp = temp.replaceAll("{token}", doc.cardToken);
    temp = temp.replaceAll("{date}", doc.birthday || '');
    var element = document.createElement("div");
    element.classList.add("id");
    element.id = 'local_' + index;
    element.innerHTML = temp;
    idCollector.appendChild(element);
    try {
        const action = element.querySelector('.id_action');
        if (action) {
            const buttons = action.querySelectorAll('p.action_button');
            if (buttons && buttons.length >= 2) {
                const editBtn = buttons[0];
                const enterBtn = buttons[1];
                if (editBtn && !editBtn._bound) {
                    editBtn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        editId('local_' + index);
                    });
                    editBtn._bound = true;
                }
                if (enterBtn && !enterBtn._bound) {
                    enterBtn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        enterId(doc.cardToken);
                    });
                    enterBtn._bound = true;
                }
            }
        }
    } catch (e) { console.warn('Binding for action buttons failed:', e); }
}

function createId(id) {
    var temp = template;
    temp = temp.replaceAll("{id}", id.id);
    temp = temp.replaceAll("{name}", htmlEncode(id.name.toUpperCase()));
    temp = temp.replaceAll("{surname}", htmlEncode(id.surname.toUpperCase()));
    temp = temp.replaceAll("{token}", id.token);
    var date = new Date();
    date.setDate(id.day);
    date.setMonth(id.month - 1);
    date.setFullYear(id.year);
    temp = temp.replaceAll("{date}", date.toLocaleDateString("pl-PL", options));
    var element = document.createElement("div");
    element.classList.add("id");
    element.id = id.id;
    element.innerHTML = temp;
    var child = idCollector.firstChild;
    if (child) {
        idCollector.insertBefore(element, child);
    } else {
        idCollector.appendChild(element);
    }
}

var deleteing = 0;

function deleteId(id) {
    if (typeof id === 'string' && id.startsWith('local_')) {
        deleteing = parseInt(id.replace('local_', ''));
        confirm.classList.add(boxOpened);
    } else {
        deleteing = parseInt(id);
        confirm.classList.add(boxOpened);
    }
}

function editId(id) {
    if (typeof id === 'string' && id.startsWith('local_')) {
        const index = parseInt(id.replace('local_', ''));
        (async () => {
            const userDocs = await safeGetDocs();
            if (userDocs[index]) {
                safeSetItem('editingDocument', JSON.stringify({ index, data: userDocs[index] }));
                navigateTo('generator', { edit: index });
            }
        })();
    } else {
        navigateTo('generator');
    }
}

function enterId(cardToken) {
    safeSetItem('lastDocumentToken', cardToken);
    (async () => {
        const userDocs = await safeGetDocs();
        const doc = userDocs.find(d => d.cardToken === cardToken);
        if (doc) {
            try {
                safeSetItem('seriesAndNumber', doc.seriesAndNumber || '');
                safeSetItem('birthDay', doc.birthday || '');
                safeSetItem('givenDate', doc.givenDate || '');
                safeSetItem('expiryDate', doc.expiryDate || '');
                safeSetItem('pesel', doc.pesel || '');
                const dataPayload = {
                    data: 'data',
                    name: doc.name || '',
                    surname: doc.surname || '',
                    nationality: doc.nationality || 'POLSKIE',
                    fathersName: doc.fathersName || '',
                    mothersName: doc.mothersName || '',
                    familyName: doc.surname || '',
                    sex: (doc.sex || '').toLowerCase().startsWith('m') ? 'm' : 'k',
                    fathersFamilyName: doc.fathersSurname || '',
                    mothersFamilyName: doc.mothersSurname || '',
                    birthPlace: doc.birthPlace || doc.city || 'WARSZAWA',
                    countryOfBirth: doc.countryOfBirth || 'POLSKA',
                    address1: (doc.street || '') + ' ' + (doc.houseNumber || ''),
                    address2: (doc.postalCode || '') + ' ' + (doc.city || ''),
                    day: doc.birthDay || (doc.birthday ? parseInt((doc.birthday.split('.')||[])[0]) : undefined),
                    month: doc.birthMonth || (doc.birthday ? parseInt((doc.birthday.split('.')||[])[1]) : undefined),
                    year: doc.birthYear || (doc.birthday ? parseInt((doc.birthday.split('.')||[])[2]) : undefined)
                };
                const imagePayload = { data: 'image', image: doc.image || '' };
                saveToIndexedDb(dataPayload, imagePayload).then(() => {
                    navigateTo('card', { card_token: cardToken });
                }).catch(() => {
                    navigateTo('card', { card_token: cardToken });
                });
            } catch (e) {
                navigateTo('card', { card_token: cardToken });
            }
        } else {
            notify("Nie znaleziono dokumentu", "error");
        }
    })();
}

function saveToIndexedDb(dataPayload, imagePayload) {
    return new Promise((resolve) => {
        const request = window.indexedDB.open('fobywatel', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'data' });
            }
        };
        request.onsuccess = (event) => {
            try {
                const db = event.target.result;
                const tx = db.transaction('data', 'readwrite');
                const store = tx.objectStore('data');
                store.put(dataPayload);
                store.put(imagePayload);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (e) {
                console.warn('IndexedDB save failed:', e);
                resolve();
            }
        };
        request.onerror = () => resolve();
    });
}

loadLocalDocuments();
