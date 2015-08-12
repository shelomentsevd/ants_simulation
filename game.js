'use strict';
//Game const
var GVar = {
    wall: '#',
    space:'.',
    actor:'@'
};

//Actor
var Actor = function (x, y) {
    this._x = x;
    this._y = y;
    this._draw();
};

Actor.prototype._draw = function () {
    Game.display.draw(this._x, this._y, GVar.actor, "#ff0");
};

//Map
var Map = function (width, height) {
    this._width      = width;
    this._height     = height;
    this._tiles      = {}; //All tiles
    this._emptyTiles = {}; //Tiles without actors and walls
    this._generate();
    this._draw();
};

//Generate map
Map.prototype._generate = function () {
    //Map generation callback
    var mapCallback = function(x, y, isItWall) {
        var key  = [x,y].join(',');
        var tile;
        
        if (isItWall) {
            tile = GVar.wall;
        } else {
            tile = GVar.space;
            this._emptyTiles.push(key);
        }
        
        this._tiles[key] = tile;
    };
    //generation starts here
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

//Game
var Game = {
    display: null,
    
    options: {},
    
    init: function() {
        this.display = new ROT.Display(this.options);
        document.body.appendChild(this.display.getContainer());
        this.options = this.display.getOptions();
        var map = new Map(this.options.width, this.options.height);
    }
}

