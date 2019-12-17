var presObj = {
    "data": {
        "referenceCode": "Paste code here",
        "lang": "plaintext"
    },
    "slides": [{ title: "", content: "" }]
};
var curSlide;
var quill;

async function loadPres() {
    if (window.location.hash) {
        let hash = window.location.hash.substring(7); //Puts hash in variable, and removes the # character
        presObj = JSON.parse(decodeURIComponent(hash));
        document.querySelector("#pres-code").innerHTML = `<pre><code class="javascript">${presObj.data.referenceCode}</code></pre>`;
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
            hljs.lineNumbersBlock(block, { singleLine: true });
        });
        curSlide = 0;
        populateSlide(curSlide);
    } else {
        alert("No presnentation loaded");
        window.location.href = "/editor.html";
    }
}

function populateSlide(i) {
    document.querySelector("#pres-content").innerHTML = `<h1>${presObj.slides[i].title}</h1>${presObj.slides[i].content}`;
    scrollCodeTo(presObj.slides[i].showCodeFrom);
}

function scrollCodeTo(i = 0, abovePadding = 3) {
    if (i - abovePadding < 0) lineNo = 0;
    else lineNo = i - abovePadding - 1;
    const lines = document.querySelector(".hljs-ln").firstChild.children;
    const line = lines.item(lineNo);
    line.scrollIntoView({ behavior: 'smooth' });
}

function move(m) {
    if (curSlide + m >= 0 && curSlide + m < presObj.slides.length) {
        curSlide += m;
        populateSlide(curSlide);
    }
}

function toggleFs() {
    const isFullscreen = document.webkitIsFullScreen || document.mozFullScreen;
    if (isFullscreen) {
        document.exitFullscreen();
        document.querySelector("#fsBtn i").innerHTML = "fullscreen";
    } else {
        const elem = document.querySelector("#presContainer");
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
        document.querySelector("#fsBtn i").innerHTML = "fullscreen_exit";
    }
}

function initEditor() {
    quill = new Quill('#editor', {
        theme: 'snow'
    });
    refreshPres(presObj);
}

async function loadPresEdit() {
    const res = await fetch("/outfile.codepres");
    presObj = await res.json();
    document.querySelector("#section-container").innerHTML = '<div class="slide-sec code-btn" onclick="showCode()"><h3>Reference Code</h3></div>';

    for (const [i, slide] of presObj.slides.entries()) {
        document.querySelector("#section-container").innerHTML += `<div class="slide-sec" onclick="gotoEdit(${i})"><h4>${slide.title}</h4></div>`;
    }
    document.querySelector("#section-container").innerHTML += `<div class="slide-sec add-slide-btn" onclick="newSlide()"s><h3>+</h3></div>`;
    curSlide = 0;
    gotoEdit(curSlide, false);
}

function gotoEdit(i, saveBefore = true) {
    hideCode();
    if (saveBefore) {
        presObj.slides[curSlide].content = quill.container.firstChild.innerHTML;
        presObj.slides[curSlide].title = document.querySelector("input#titleText").value;
        presObj.slides[curSlide].showCodeFrom = document.querySelector("input#coderef").value;
        document.querySelector("#section-container").innerHTML = '<div class="slide-sec code-btn" onclick="showCode()"><h3>Reference Code</h3></div>';
        for (const [i, slide] of presObj.slides.entries()) {
            document.querySelector("#section-container").innerHTML += `<div class="slide-sec slide-rcm" onclick="gotoEdit(${i})" data-slide-no="${i}"><h4 class="slide-rcm">${slide.title}</h4></div>`;
            console.log(document.querySelector("#section-container").lastChild);
        }
        document.querySelector("#section-container").innerHTML += `<div class="slide-sec add-slide-btn" onclick="newSlide()"><h3>+</h3></div>`;
    }
    //todo: save work 
    let slides = document.querySelector("#section-container").children;
    for (let j = 0; j < slides.length; j++) slides[j].classList.remove('active');
    slides.item(i + 1).classList.add('active');
    quill.clipboard.dangerouslyPasteHTML(presObj.slides[i].content);
    document.querySelector("input#titleText").value = presObj.slides[i].title;
    document.querySelector("input#coderef").value = presObj.slides[i].showCodeFrom;
    curSlide = i;
}

function newSlide(content = { title: "", content: "" }) {
    if (presObj.slides.length > 0) {
        presObj.slides.push(content);
        gotoEdit(presObj.slides.length - 1);
    } else {
        presObj.slides.push(content);
        gotoEdit(presObj.slides.length - 1, false);
    }
}

function gotoPres() {
    const presStr = encodeURIComponent(JSON.stringify(presObj));
    window.location.href = "/present.html#@pres=" + presStr;
}

function savePres(presName) {
    localStorage.setItem(presName, JSON.stringify(presObj));
}

function loadPresFromLS(presName) {
    presObj = JSON.parse(localStorage.getItem(presName));
    refreshPres(presObj);
}

function refreshPres(presObj) {
    document.querySelector("#section-container").innerHTML = '<div class="slide-sec code-btn" onclick="showCode()"><h3>Reference Code</h3></div>';
    for (const [i, slide] of presObj.slides.entries()) {
        document.querySelector("#section-container").innerHTML += `<div class="slide-sec slide-rcm" onclick="gotoEdit(${i})"><h4 class="slide-rcm">${slide.title}</h4></div>`;
    }
    document.querySelector("#section-container").innerHTML += `<div class="slide-sec add-slide-btn" onclick="newSlide()"s><h3>+</h3></div>`;
    curSlide = 0;
    gotoEdit(curSlide, false);
    document.querySelector('.code-area').value = presObj.data.referenceCode;
    document.addEventListener("contextmenu", e => {
        if (e.target.classList.contains('slide-rcm')) {
            e.preventDefault();
            showMenuAt(e.pageX, e.pageY, e.target.getAttribute("data-slide-no"));
        }
    });
}

function newPres(name) {
    const emptypres = {
        "data": {
            "referenceCode": "Paste code here",
            "lang": "plaintext"
        },
        "slides": [{
            "title": "",
            "content": "",
            "showCodeFrom": 1
        }]
    };
    localStorage.setItem(name, JSON.stringify(emptypres));
    loadPresFromLS(name);
}

function showMenuAt(x, y, slideNo = 0) {
    let menu = document.querySelector("div.context-menu");
    let bg = document.querySelector("#click-away-area");
    bg.style.display = "block";
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;
    menu.setAttribute("data-references-slide", slideNo);
}

function hideMenu() {
    let bg = document.querySelector("#click-away-area");
    bg.style.display = "none";
}

function duplicateSlide() {
    let menu = document.querySelector("div.context-menu");
    const dupSlide = presObj.slides[menu.getAttribute("data-references-slide")];
    const insertionPos = parseInt(menu.getAttribute("data-references-slide"), 10) + 1;
    console.log(presObj);
    if (insertionPos < presObj.slides.length) presObj.slides.splice(insertionPos, 0, dupSlide);
    else newSlide(dupSlide);
    console.log(presObj);
    refreshPres(presObj);
}

function delSlide() {
    if (presObj.slides.length == 1) return;
    let menu = document.querySelector("div.context-menu");
    const delIndex = parseInt(menu.getAttribute("data-references-slide"), 10);
    presObj.slides.splice(delIndex, 1);
    refreshPres(presObj);
}

function saveCur() {
    presObj.slides[curSlide].content = quill.container.firstChild.innerHTML;
    presObj.slides[curSlide].title = document.querySelector("input#titleText").value;
    presObj.slides[curSlide].showCodeFrom = document.querySelector("input#coderef").value;
    document.querySelector("#section-container").innerHTML = '<div class="slide-sec code-btn" onclick="showCode()"><h3>Reference Code</h3></div>';

    for (const [i, slide] of presObj.slides.entries()) {
        document.querySelector("#section-container").innerHTML += `<div class="slide-sec slide-rcm" onclick="gotoEdit(${i})" data-slide-no="${i}"><h4 class="slide-rcm">${slide.title}</h4></div>`;
        console.log(document.querySelector("#section-container").lastChild);
    }
    document.querySelector("#section-container").innerHTML += `<div class="slide-sec add-slide-btn" onclick="newSlide()"><h3>+</h3></div>`;
}

function showCode() {
    document.querySelector("#code-editor").style.display = "block";
    let slides = document.querySelector("#section-container").children;
    for (let j = 0; j < slides.length; j++) slides[j].classList.remove('active');
}

function hideCode() {
    document.querySelector("#code-editor").style.display = "none";
}

function saveCode() {
    presObj.data.referenceCode = document.querySelector(".code-area").value;
}