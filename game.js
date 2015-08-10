'use strict';
var Actor = function (x, y) {
    this._x = x;
    this._y = y;
    this._draw();
};

Actor.prototype._draw = function () {
    Game.display.draw(this._x, this._y, "@", "#ff0");
};

var Map = function (width, height) {
    this._width  = width;
    this._height = height;
    this._tiles  = {};
    this._generate();
    this._draw();
};

//Generate map
Map.prototype._generate = function () {
    //Map generation callback
    var mapCallback = function(x, y, value) {
        var key  = [x,y].join(',');
        var tile  = (value)?'#':'.';
        
        this._tiles[key] = tile;
    };
    //genaration starts here
    var arena = new ROT.Map.IceyMaze(this._width, this._height);
    arena.create(mapCallback.bind(this));
};
//Draw map
Map.prototype._draw = function () {
    for(var key in this._tiles) {
        //Just for fun ^_^
        var [x, y] = key.split(',').map(function(item) {
            return parseInt(item);
        });
    Game.display.draw(x, y, this._tiles[key]);
    }
};

var Game = {
    display: null,
    
    options: {
        //width:  60,
        //height: 30,
        //bg:     "#00E0F0"
    },
    
    init: function() {
        this.display = new ROT.Display(this.options);
        document.body.appendChild(this.display.getContainer());
        this.options = this.display.getOptions();
        var map = new Map(this.options.width, this.options.height);
    }
}

