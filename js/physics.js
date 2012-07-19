var PX_TO_M = 1.0 / 50.0;

function RectangularThing(options) {
  var width = options.width * PX_TO_M,
      height = options.height * PX_TO_M,
      x = options.left * PX_TO_M,
      y = options.bottom * PX_TO_M;

  this.bodyDef = new Box2D.b2BodyDef();
  
  if (options.type == "dynamic") {
    this.bodyDef.set_type(Box2D.b2_dynamicBody);
  } else if (options.type == "static") {
  } else
    throw new Error("unknown type: " + options.type);
  
  var halfWidth = width / 2;
  var halfHeight = height / 2;
  var pos = new Box2D.b2Vec2(x + halfWidth, y + halfHeight);
  
  this.element = options.element;
  this._width = width;
  this._height = height;
  this.bodyDef.set_position(pos);
  this.body = options.world.CreateBody(this.bodyDef);
  this.box = new Box2D.b2PolygonShape();
  this.box.SetAsBox(halfWidth, halfHeight);
  this.fixture = new Box2D.b2FixtureDef();
  this.fixture.set_shape(this.box);
  this.fixture.set_density(options.density || 0.0);
  this.fixture.set_friction(options.friction || 0.0);
  this.body.CreateFixture(this.fixture);
}

RectangularThing.prototype = {
  updateElement: function() {
    var metrics = this.getMetrics(),
        transform = "rotate(" + -metrics.angle.toFixed(2) + "rad)",
        style = this.element.style;
    
    style.bottom = metrics.bottom.toFixed(2) + "px";
    style.left = metrics.left.toFixed(2) + "px";
    style.width = metrics.width.toFixed(2) + "px";
    style.height = metrics.height.toFixed(2) + "px";
    
    ['-moz-', '-webkit-', '-o', ''].forEach(function(prefix) {
      style.setProperty(prefix + 'transform', transform, "");
    });
  },
  getMetrics: function() {
    var pos = this.body.GetPosition();
    return {
      left: (pos.get_x() - (this._width/2)) / PX_TO_M,
      bottom: (pos.get_y() - (this._height/2)) / PX_TO_M,
      width: this._width / PX_TO_M,
      height: this._height / PX_TO_M,
      angle: this.body.GetAngle()
    };
  }
};

function loadScript(url, cb) {
  // http://blog.typekit.com/2011/05/25/loading-typekit-fonts-asynchronously/
  var tk = document.createElement('script');
  tk.src = url;
  tk.type = 'text/javascript';
  tk.async = 'true';
  tk.onload = tk.onreadystatechange = function() {
    var rs = this.readyState;
    if (rs && rs != 'complete' && rs != 'loaded') return;
    cb();
  };
  var s = document.getElementsByTagName('script')[0] || document.body;
  s.parentNode.insertBefore(tk, s);
}

onload = function() {
  var worldParent = document.getElementById('world') || document.body;
  
  function btn(name, cb) {
    var button = document.createElement('button');
    button.textContent = name;
    button.onclick = cb;
    worldParent.appendChild(button);
  }
  
  function go(cb) {
    loadScript("http://labs.toolness.com/temp/box2d.js", function() {
      var physics = startPhysics(worldParent);
      if (cb)
        cb(physics);
    });
  }

  function setupUI() {
    btn("start physics", function() {
      this.parentNode.removeChild(this);
      var originalHTML = worldParent.innerHTML;
      go(function(physics) {
        btn("stop physics", function() {
          this.parentNode.removeChild(this);
          physics.stop();
          worldParent.innerHTML = originalHTML;
          setupUI();
        });
      });
    });
    return btn;
  }
  
  if (window.Thimble) {
    setupUI();
  } else
    go();
};

function startPhysics(worldParent) {
  var gravity = new Box2D.b2Vec2(0.0, -10.0);
  var world = new Box2D.b2World(gravity, true);
  var objects = [];
  var movables = worldParent.querySelectorAll('.thimble-movable');
  
  function strAttr(element, name, defaultValue) {
    if (!element.hasAttribute(name))
      return defaultValue;
    return element.getAttribute(name);
  }

  function floatAttr(element, name, defaultValue) {
    if (!element.hasAttribute(name))
      return defaultValue;
    var result = parseFloat(element.getAttribute(name));
    if (!isNaN(result))
      return result;
    return defaultValue;
  }

  var worldBounds = worldParent.getBoundingClientRect();

  for (var i = 0; i < movables.length; i++) {
    var element = movables[i];
    var bounds = element.getBoundingClientRect();
    var left = bounds.left - worldBounds.left;
    var bottom = worldBounds.bottom - bounds.bottom;
    element.style.position = "absolute";
    element.style.top = '';
    element.style.right = '';
    element.style.left = left + 'px';
    element.style.bottom = bottom + 'px';
    objects.push(new RectangularThing({
      left: left,
      bottom: bottom,
      width: bounds.width,
      height: bounds.height,
      type: strAttr(element, "data-physics-type", "static"),
      density: floatAttr(element, "data-density", 0),
      friction: floatAttr(element, "data-friction", 0),
      world: world,
      element: element
    }));
  }
  
  var velocityIterations = 6;
  var positionIterations = 2;
  var startTime = Date.now();
  
  var interval = setInterval(function() {
    var realTimePassed = Date.now() - startTime;
    world.Step(realTimePassed / 100000.0, velocityIterations, 
               positionIterations);
    objects.forEach(function(o) { o.updateElement(); });
  }, 20);
  
  return {
    stop: function() {
      clearInterval(interval);
    }
  };
};
