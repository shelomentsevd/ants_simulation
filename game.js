'use strict';
//Game const
var GVar = {
    wall: '#',
    space:'.',
    actor:'a',
    spawn:'S'
};

//Common functions
var Common = {
    key2xy: function (key) {
        return key.split(',').map(function(item) {
            return parseInt(item);
        });
    },
    xy2key: function (x, y) {
        return [x, y].join(',');
    }
};

//Actor
var Actor = function (x, y) {
    this._x = x;
    this._y = y;
    this._draw();
    this._lookAround();
    //Delete x,y cell from freeCells
};

Actor.prototype._draw = function () {
    Game.display.draw(this._x, this._y, GVar.actor, "#ff0");
};

//Return's free cells in radius 1
Actor.prototype._lookAround = function () {
    //Game.map.calculateView(this._x, this._y, 1);
};

//Actor spawn
var ActorSpawn = function (x, y) {
    this._x = x;
    this._y = y;
    this._actors = [];
    this._draw();
};

ActorSpawn.prototype._draw = function () {
    Game.display.draw(this._x, this._y, GVar.spawn);
};

ActorSpawn.prototype._createActor = function () {
    var cell = Game.map.getFreeWays(this._x, this._y)[0];
    
};

//Map
var Map = function (width, height) {
    this._width      = width;
    this._height     = height;
    this._cells      = {}; //All tiles
    this._freeCells = []; //Tiles without actors and walls
    this._generate();
    this._draw();
};

//Generate map
Map.prototype._generate = function () {
    //Map generation callback
    var mapCallback = function(x, y, isItWall) {
        var key  = Common.xy2key(x, y);
        var tile;
        
        if (isItWall) {
            tile = GVar.wall;
        } else {
            tile = GVar.space;
            this._freeCells.push(key);
        }
        
        this._cells[key] = tile;
    };
    //generation starts here
    var arena = new ROT.Map.IceyMaze(this._width, this._height);
    arena.create(mapCallback.bind(this));
};

//Draw map
Map.prototype._draw = function () {
    for(var key in this._cells) {
        var [x, y] = Common.key2xy(key);
        Game.display.draw(x, y, this._cells[key]);
    }
};

//If cell from x,y coordinate isn't wall return true
Map.prototype._isVisible = function (x, y) {
    var key = xy2key(x, y);
    return this._freeCells.indexOf(key) != -1;
};

//
Map.prototype._calculateView = function (x, y, r) {
    var fov = new ROT.FOV.DiscreteShadowcasting(this._isVisible.bind(this));
    var result = [];
    var viewCallback = function (x, y, r, visible) {
        if(visible) {
            var key = xy2key(x, y);
            this.push(key);
            var tile = Game.map._cells[key];
            Game.display.draw(x, y, tile, '#ff0');
        }
    };
    
    fov.compute(x, y, r, viewCallback.bind(result));
    
    return result;
};

//Get cells for move
Map.prototype.getFreeWays = function (x, y) {
    var visibleCells = this._calculateView(x, y, 1);
    var result = [];
    for(var key in visibleCells) {
      if(this._cells.indexOf(key) != -1)
        result.push(key);
    }
};

Map.prototype.getRandomEmptyCell = function () {
    var index = Math.floor(ROT.RNG.getUniform() * this._freeCells.length);
    var key = this._freeCells[index];
    return Common.key2xy(key);
};
//Game
var Game = {
    display: null,
    
    options: {},
    
    map: null,
    
    actors: [],
    
    init: function() {
        this.display = new ROT.Display(this.options);
        document.body.appendChild(this.display.getContainer());
        this.options = this.display.getOptions();
        this.map = new Map(this.options.width, this.options.height);
        var [x, y] = this.map.getRandomEmptyCell();
        var player = new Actor(x, y);
    }
}

