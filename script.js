
let worker;
function update() {
  const cell = parseFloat($('#cell').val()); // inch
  const prefix = $('#prefix').val();

  $('#output').text('rendering...')
  $('#loader').addClass('active')
  worker.postMessage({
    type: 'render',
    img: $('#img').val(),
    cell: cell,
    prefix: prefix || ""
  })
}

function initWorker() {
  worker = new Worker('worker.js');
  worker.addEventListener('message', function(e) {
    const d = e.data;
    //console.log('Worker said: ', d);
    if (d.type !== "render") return;

    $('#loader').removeClass('active')
    $('#output').text(d.output);
    $('#model').empty();
    $('#legomodel').empty();
    d.cards.forEach(c => {
      const card = $(c.card);
      card.attr("href", URL.createObjectURL(new Blob([c.href])))
      $('#model').append(card)
    });
    d.legocards.forEach(c => {
      const card = $(c.card);
      card.attr("href", URL.createObjectURL(new Blob([c.href])))
      $('#legomodel').append(card)
    });
    if (d.svg) {
      $('#preview').empty();
      const img = document.createElement("img")
      img.onerror = function(e) { console.log(e) }
      img.onload = function() {
        const cvs = document.createElement("canvas");
        cvs.width = img.width;
        cvs.height = img.height;
        cvs.style.maxWidth = "15rem"
        const ctx = cvs.getContext("2d");
        ctx.drawImage(img, 0, 0)
        const a = document.createElement("a")
        a.href = cvs.toDataURL('image/png')
        a.download = $('#prefix').val() + "-pixelart.png"
        a.append(cvs)
        $('#preview').append($(a));
      }
      img.src = "data:image/svg+xml;base64," + btoa(d.svg);
    }
    if (d.beadsSvg) {
      $('#beadssvg').empty();
      const img = document.createElement("img")
      img.src = "data:image/svg+xml;base64," + btoa(d.beadsSvg);
      const a = document.createElement("a")
      a.href = img.src;
      a.download = $('#prefix').val() + "-beads.svg"
      a.append(img)
      $('#beadssvg').append($(a));
    }
    if (d.image) {
      $('#beads').empty()
      for(let pw = 1; pw <= 8; ++pw) {
        const cvs = document.createElement("canvas");
        cvs.width = d.width * pw;
        cvs.height = d.height * pw;
        const ctx = cvs.getContext("2d");
        for(let x = 0; x < d.width; ++x) {
            for (let y = 0; y < d.height; ++y) {
              const p = d.image[y * d.width + x];
              if (p > 0) {
                const c = d.palette[p];
                ctx.fillStyle = '#' + (("0000000" + c.toString(16)).slice(-6));
                ctx.fillRect(x * pw, y * pw, pw, pw, c)
              }
            }
          }
        const a = document.createElement("a")
        a.href = cvs.toDataURL('image/png')
        a.download = $('#prefix').val() + "-beads" + pw + "x" + pw + ".png"
        a.title = a.download
        a.append(cvs)
        $('#beads').append($(a));

        const favicon = document.querySelector('[rel=icon]');
        favicon.href = a.href;

        document.body.style.backgroundImage = `url(${a.href})`
        document.body.style.backgroundBlendMode = "soft-light";
      }
    }
  }, false);
}



$(function() {
  console.log(`loaded...`)
  $('#generate').click(update)
  $('#img').bind("paste", update)
  $('#img').val(`
let mySprite = sprites.create(img\`
    . . . . . . . . . . . 6 6 6 6 6
    . . . . . . . . . 6 6 7 7 7 7 8
    . . . . . . 8 8 8 7 7 8 8 6 8 8
    . . e e e e c 6 6 8 8 . 8 7 8 .
    . e 2 5 4 2 e c 8 . . . 6 7 8 .
    e 2 4 2 2 2 2 2 c . . . 6 7 8 .
    e 2 2 2 2 2 2 2 c . . . 8 6 8 .
    e 2 e e 2 2 2 2 e e e e c 6 8 .
    c 2 e e 2 2 2 2 e 2 5 4 2 c 8 .
    . c 2 e e e 2 e 2 4 2 2 2 2 c .
    . . c 2 2 2 e e 2 2 2 2 2 2 2 e
    . . . e c c e c 2 2 2 2 2 2 2 e
    . . . . . . . c 2 e e 2 2 e 2 c
    . . . . . . . c e e e e e e 2 c
    . . . . . . . . c e 2 2 2 2 c .
    . . . . . . . . . c c c c c . .
    \`, SpriteKind.Player)
`)
  $('#cell').val(0.81)
  $('#prefix').val("strawberry")
  initWorker();
  update();
})

console.log('starting...')
