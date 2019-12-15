var presObj;
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
}

async function loadPresEdit() {
    const res = await fetch("/outfile.codepres");
    presObj = await res.json();
    document.querySelector("#section-container").innerHTML = '';
    for (const [i, slide] of presObj.slides.entries()) {
        document.querySelector("#section-container").innerHTML += `<div class="slide-sec" onclick="gotoEdit(${i})"><h4>${slide.title}</h4></div>`;
    }
    document.querySelector("#section-container").innerHTML += `<div class="slide-sec add-slide-btn" onclick="newSlide()"s><h3>+</h3></div>`;
    curSlide = 0;
    gotoEdit(curSlide, false);
}

function gotoEdit(i, saveBefore = true) {
    if (saveBefore) {
        presObj.slides[curSlide].content = quill.container.firstChild.innerHTML;
        presObj.slides[curSlide].title = document.querySelector("input#titleText").value;
        presObj.slides[curSlide].showCodeFrom = document.querySelector("input#coderef").value;
        document.querySelector("#section-container").innerHTML = '';
        for (const [i, slide] of presObj.slides.entries()) {
            document.querySelector("#section-container").innerHTML += `<div class="slide-sec" onclick="gotoEdit(${i})"><h4>${slide.title}</h4></div>`;
        }
        document.querySelector("#section-container").innerHTML += `<div class="slide-sec add-slide-btn" onclick="newSlide()"><h3>+</h3></div>`;
    }
    //todo: save work 
    let slides = document.querySelector("#section-container").children;
    for (let j = 0; j < slides.length; j++) slides[j].classList.remove('active');
    slides.item(i).classList.add('active');
    quill.clipboard.dangerouslyPasteHTML(presObj.slides[i].content);
    document.querySelector("input#titleText").value = presObj.slides[i].title;
    document.querySelector("input#coderef").value = presObj.slides[i].showCodeFrom;
    curSlide = i;
}

function newSlide() {
    presObj.slides.push({ title: "", content: "" });
    gotoEdit(presObj.slides.length - 1);
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
    document.querySelector("#section-container").innerHTML = '';
    for (const [i, slide] of presObj.slides.entries()) {
        document.querySelector("#section-container").innerHTML += `<div class="slide-sec" onclick="gotoEdit(${i})"><h4>${slide.title}</h4></div>`;
    }
    document.querySelector("#section-container").innerHTML += `<div class="slide-sec add-slide-btn" onclick="newSlide()"s><h3>+</h3></div>`;
    curSlide = 0;
    gotoEdit(curSlide, false);
}