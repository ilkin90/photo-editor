document.addEventListener('DOMContentLoaded', function () {
  // Canvas və state menecmenti
  const canvas = new fabric.Canvas('canvas');
  let state = [];
  let mods = 0;

  function saveState() {
    state = state.slice(0, mods + 1);
    state.push(JSON.stringify(canvas));
    mods = state.length - 1;
  }

  function updateLayers() {
    const layerList = document.getElementById('layer-list');
    layerList.innerHTML = '';
    canvas.getObjects().forEach((obj, index) => {
      const li = document.createElement('li');
      li.textContent = obj.type + ' ' + (index + 1);
      layerList.appendChild(li);
    });
  }

  saveState();
  canvas.on('object:modified', function() {
    saveState();
    updateLayers();
  });
  canvas.on('object:added', function() {
    saveState();
    updateLayers();
  });

  // Undo/Redo funksiyaları
  document.getElementById('btn-undo').addEventListener('click', function() {
    if (mods > 0) {
      mods -= 1;
      canvas.loadFromJSON(state[mods], function() {
        canvas.renderAll();
        updateLayers();
      });
    }
  });
  document.getElementById('btn-redo').addEventListener('click', function() {
    if (mods < state.length - 1) {
      mods += 1;
      canvas.loadFromJSON(state[mods], function() {
        canvas.renderAll();
        updateLayers();
      });
    }
  });

  // Sekil yükləmə və avtomatik miqyaslanma (orijinal keyfiyyəti pozulmur)
  const fileInput = document.getElementById('fileUpload');
  document.getElementById('btn-upload').addEventListener('click', function() {
    fileInput.click();
  });
  fileInput.addEventListener('change', function(e){
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(f){
        fabric.Image.fromURL(f.target.result, function(img){
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          const scaleFactor = Math.min(canvasWidth / img.width, canvasHeight / img.height, 1);
          if (scaleFactor < 1) {
            img.scale(scaleFactor);
          }
          img.set({ 
            left: (canvasWidth - img.getScaledWidth()) / 2, 
            top: (canvasHeight - img.getScaledHeight()) / 2 
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          saveState();
          updateLayers();
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Crop funksiyası
  let cropper;
  document.getElementById('btn-crop').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if (active && active.type === 'image') {
      const modal = document.getElementById('cropModal');
      const cropImage = document.getElementById('cropImage');
      cropImage.src = active.getSrc();
      modal.style.display = 'flex';
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImage, { aspectRatio: NaN, viewMode: 1 });
    } else {
      alert("Şəkil seçilməyib.");
    }
  });
  document.getElementById('cancelCrop').addEventListener('click', function(){
    document.getElementById('cropModal').style.display = 'none';
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  });
  document.getElementById('applyCrop').addEventListener('click', function(){
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      const dataURL = croppedCanvas.toDataURL();
      const active = canvas.getActiveObject();
      if (active) {
        fabric.Image.fromURL(dataURL, function(img){
          img.set({
            left: active.left,
            top: active.top,
            angle: active.angle
          });
          canvas.remove(active);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          saveState();
          updateLayers();
        });
      }
      document.getElementById('cropModal').style.display = 'none';
      cropper.destroy();
      cropper = null;
    }
  });

  // Rotate: Fırlatma və flip (canlı yenilənmə)
  document.getElementById('btn-rotate').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if (active) {
      let currentAngle = active.angle || 0;
      document.getElementById('rotationSlider').value = currentAngle;
      document.getElementById('rotationInput').value = currentAngle;
      document.getElementById('flipHorizontal').checked = active.flipX || false;
      document.getElementById('flipVertical').checked = active.flipY || false;
      const btnRect = this.getBoundingClientRect();
      const rotateModal = document.getElementById('rotateModal');
      rotateModal.style.top = btnRect.top + "px";
      rotateModal.style.left = (btnRect.right + 10) + "px";
      rotateModal.style.display = 'block';
    } else {
      alert("Zəhmət olmasa, obyekt seçin.");
    }
  });
  document.getElementById('rotationSlider').addEventListener('input', function(){
    const active = canvas.getActiveObject();
    if(active){
      const angleValue = parseFloat(this.value);
      active.rotate(angleValue);
      document.getElementById('rotationInput').value = this.value;
      active.set('flipX', document.getElementById('flipHorizontal').checked);
      active.set('flipY', document.getElementById('flipVertical').checked);
      canvas.renderAll();
    }
  });
  document.getElementById('rotationInput').addEventListener('input', function(){
    const active = canvas.getActiveObject();
    if(active){
      const angleValue = parseFloat(this.value);
      active.rotate(angleValue);
      document.getElementById('rotationSlider').value = this.value;
      canvas.renderAll();
    }
  });
  document.getElementById('cancelRotate').addEventListener('click', function(){
    document.getElementById('rotateModal').style.display = 'none';
  });
  document.getElementById('applyRotate').addEventListener('click', function(){
    document.getElementById('rotateModal').style.display = 'none';
    saveState();
    updateLayers();
  });

  // Scale: Ölçü dəyişməsi (canlı)
  document.getElementById('btn-scale').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if (active) {
      let currentScale = active.scaleX || 1;
      document.getElementById('scaleSlider').value = currentScale;
      document.getElementById('scaleInput').value = currentScale;
      const btnRect = this.getBoundingClientRect();
      const scaleModal = document.getElementById('scaleModal');
      scaleModal.style.top = btnRect.top + "px";
      scaleModal.style.left = (btnRect.right + 10) + "px";
      scaleModal.style.display = 'block';
    } else {
      alert("Obyekt seçin.");
    }
  });
  document.getElementById('scaleSlider').addEventListener('input', function(){
    const active = canvas.getActiveObject();
    if(active){
      const scaleFactor = parseFloat(this.value);
      active.scale(scaleFactor);
      document.getElementById('scaleInput').value = this.value;
      canvas.renderAll();
    }
  });
  document.getElementById('scaleInput').addEventListener('input', function(){
    const active = canvas.getActiveObject();
    if(active){
      const scaleFactor = parseFloat(this.value);
      active.scale(scaleFactor);
      document.getElementById('scaleSlider').value = this.value;
      canvas.renderAll();
    }
  });
  document.getElementById('cancelScale').addEventListener('click', function(){
    document.getElementById('scaleModal').style.display = 'none';
  });
  document.getElementById('applyScale').addEventListener('click', function(){
    document.getElementById('scaleModal').style.display = 'none';
    saveState();
    updateLayers();
  });

  // Arrange: Obyektin adını və opasitesini canlı yeniləmə
  document.getElementById('btn-arrange').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active){
      document.getElementById('objectName').value = active.name || '';
      document.getElementById('opacitySlider').value = active.opacity || 1;
      document.getElementById('opacityInput').value = active.opacity || 1;
      const btnRect = this.getBoundingClientRect();
      const arrangeModal = document.getElementById('arrangeModal');
      arrangeModal.style.top = btnRect.top + "px";
      arrangeModal.style.left = (btnRect.right + 10) + "px";
      arrangeModal.style.display = 'block';
    } else {
      alert("Obyekt seçin.");
    }
  });
  document.getElementById('objectName').addEventListener('input', function(){
    const active = canvas.getActiveObject();
    if(active){
      active.name = this.value;
      updateLayers();
    }
  });
  document.getElementById('opacitySlider').addEventListener('input', function(){
    const active = canvas.getActiveObject();
    if(active){
      active.set('opacity', parseFloat(this.value));
      document.getElementById('opacityInput').value = this.value;
      canvas.renderAll();
    }
  });
  document.getElementById('opacityInput').addEventListener('input', function(){
    const active = canvas.getActiveObject();
    if(active){
      active.set('opacity', parseFloat(this.value));
      document.getElementById('opacitySlider').value = this.value;
      canvas.renderAll();
    }
  });
  document.getElementById('cancelArrange').addEventListener('click', function(){
    document.getElementById('arrangeModal').style.display = 'none';
    saveState();
  });

  // Adjust: Rəng ayarları (Brightness, Contrast, Saturation) – canlı dəyişiklik
  document.getElementById('btn-adjust').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if (active && active.type === 'image') {
      const btnRect = this.getBoundingClientRect();
      const adjustModal = document.getElementById('adjustModal');
      adjustModal.style.top = btnRect.top + "px";
      adjustModal.style.left = (btnRect.right + 10) + "px";
      adjustModal.style.display = 'block';
    } else {
      alert("Şəkil seçin.");
    }
  });
  function applyAdjustFilters() {
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Brightness' && f.type !== 'Contrast' && f.type !== 'Saturation');
      const brightnessVal = parseFloat(document.getElementById('brightnessSlider').value);
      const contrastVal = parseFloat(document.getElementById('contrastSlider').value);
      const saturationVal = parseFloat(document.getElementById('saturationSlider').value);
      if(brightnessVal !== 0) {
        active.filters.push(new fabric.Image.filters.Brightness({ brightness: brightnessVal }));
      }
      if(contrastVal !== 0) {
        active.filters.push(new fabric.Image.filters.Contrast({ contrast: contrastVal }));
      }
      if(saturationVal !== 0) {
        active.filters.push(new fabric.Image.filters.Saturation({ saturation: saturationVal }));
      }
      active.applyFilters();
      canvas.renderAll();
    }
  }
  document.getElementById('brightnessSlider').addEventListener('input', applyAdjustFilters);
  document.getElementById('contrastSlider').addEventListener('input', applyAdjustFilters);
  document.getElementById('saturationSlider').addEventListener('input', applyAdjustFilters);
  document.getElementById('cancelAdjust').addEventListener('click', function(){
    document.getElementById('adjustModal').style.display = 'none';
    saveState();
  });

  // Effektlər: Grid modalı, hər düyməyə uyğun filter tətbiqi
  document.getElementById('btn-effect').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      const btnRect = this.getBoundingClientRect();
      const effectModal = document.getElementById('effectModal');
      effectModal.style.top = btnRect.top + "px";
      effectModal.style.left = (btnRect.right + 10) + "px";
      effectModal.style.display = 'block';
    } else {
      alert("Şəkil seçin.");
    }
  });
  document.getElementById('effect-grayscale').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Grayscale');
      active.filters.push(new fabric.Image.filters.Grayscale());
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('effect-sepia').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Sepia');
      active.filters.push(new fabric.Image.filters.Sepia());
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('effect-invert').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Invert');
      active.filters.push(new fabric.Image.filters.Invert());
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('effect-brightness').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Brightness');
      active.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.2 }));
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('effect-contrast').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Contrast');
      active.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.2 }));
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('effect-blur').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Blur');
      active.filters.push(new fabric.Image.filters.Blur({ blur: 0.5 }));
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('effect-saturation').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Saturation');
      active.filters.push(new fabric.Image.filters.Saturation({ saturation: 0.2 }));
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('cancelEffect').addEventListener('click', function(){
    document.getElementById('effectModal').style.display = 'none';
    saveState();
  });

  // Retouch: Sadə alətlər (Blur və Sharpen)
  document.getElementById('btn-retouch').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      const btnRect = this.getBoundingClientRect();
      const retouchModal = document.getElementById('retouchModal');
      retouchModal.style.top = btnRect.top + "px";
      retouchModal.style.left = (btnRect.right + 10) + "px";
      retouchModal.style.display = 'block';
    } else {
      alert("Şəkil seçin.");
    }
  });
  document.getElementById('retouch-blur').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      active.filters = active.filters.filter(f => f.type !== 'Blur');
      active.filters.push(new fabric.Image.filters.Blur({ blur: 0.7 }));
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('retouch-sharpen').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active && active.type === 'image'){
      const sharpenMatrix = [
         0, -1,  0,
        -1,  5, -1,
         0, -1,  0
      ];
      active.filters = active.filters.filter(f => f.type !== 'Convolute');
      active.filters.push(new fabric.Image.filters.Convolute({ matrix: sharpenMatrix }));
      active.applyFilters();
      canvas.renderAll();
    }
  });
  document.getElementById('cancelRetouch').addEventListener('click', function(){
    document.getElementById('retouchModal').style.display = 'none';
    saveState();
  });

  // Drawing: Brush, Eraser, Pen, Fill, Shapes
  document.getElementById('btn-drawing').addEventListener('click', function(){
    const btnRect = this.getBoundingClientRect();
    const drawingModal = document.getElementById('drawingModal');
    drawingModal.style.top = btnRect.top + "px";
    drawingModal.style.left = (btnRect.right + 10) + "px";
    drawingModal.style.display = 'block';
  });
  document.getElementById('drawing-brush').addEventListener('click', function(){
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = "#000000";
    canvas.freeDrawingBrush.width = 5;
  });
  document.getElementById('drawing-eraser').addEventListener('click', function(){
    canvas.isDrawingMode = true;
    if (fabric.EraserBrush) {
      canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
      canvas.freeDrawingBrush.width = 10;
    } else {
      // Əgər EraserBrush dəstəklənmirsə, ağ rəngdə fırça ilə simulyasiya
      canvas.freeDrawingBrush.color = "#ffffff";
      canvas.freeDrawingBrush.width = 10;
    }
  });
  document.getElementById('drawing-pen').addEventListener('click', function(){
    canvas.isDrawingMode = false;
    let drawing = false;
    let path;
    canvas.on('mouse:down', function(o) {
      drawing = true;
      const pointer = canvas.getPointer(o.e);
      path = new fabric.Path('M ' + pointer.x + ' ' + pointer.y, { 
        stroke: '#000',
        strokeWidth: 2,
        fill: '',
        selectable: false
      });
      canvas.add(path);
    });
    canvas.on('mouse:move', function(o) {
      if (!drawing) return;
      const pointer = canvas.getPointer(o.e);
      path.path.push(['L', pointer.x, pointer.y]);
      canvas.renderAll();
    });
    canvas.on('mouse:up', function(o) {
      drawing = false;
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      saveState();
      updateLayers();
    });
  });
  document.getElementById('drawing-fill').addEventListener('click', function(){
    const active = canvas.getActiveObject();
    if(active){
      const fillColor = prompt("Doldurmaq üçün rəng daxil edin (hex kod və ya rəng adı):", "#ff0000");
      if(fillColor){
        active.set('fill', fillColor);
        canvas.renderAll();
        saveState();
      }
    } else {
      alert("Obyekt seçin.");
    }
  });
  document.getElementById('drawing-shapes').addEventListener('click', function(){
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      fill: '#D81B60',
      width: 50,
      height: 50
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    saveState();
    updateLayers();
  });
  document.getElementById('cancelDrawing').addEventListener('click', function(){
    document.getElementById('drawingModal').style.display = 'none';
    canvas.isDrawingMode = false;
    saveState();
  });

  // Text: Yeni mətn əlavə (obyektin ölçüsünü kənarlardan dəyişmək mümkün olacaq)
  // Text: Yeni mətn əlavə (obyektin ölçüsünü kənarlardan dəyişmək mümkün olacaq)
document.getElementById('btn-text').addEventListener('click', function(){
  const text = new fabric.IText('Yeni Mətn', {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    fontFamily: 'Arial',
    fill: '#000000',
    fontSize: 20,
    originX: 'center',
    originY: 'center'
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
  saveState();
  updateLayers();
}) 

});
