'use strict';
//Game const
var GVar = {
    //Maximum value of pheromone on cell
    pheromoneMax: 100,
    //
    pheromoneIncr: 10,
    pheromoneDecr: 0.2,
    //Maximum actors which spawn can have
    actorsCount: 10,
    //ms between two actions
    timeout: 100,
    wall: '#',
    space:'.',
    actor:'a',
    spawn:'S'
};

//Common functions
var Common = {
    key2xy: function (key) {
        var result = key.split(',').map(function(item) {
            return parseInt(item);
        });
        return result;
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
    //Delete x,y cell from freeCells
};

Actor.prototype._draw = function () {
    Game.display.draw(this._x, this._y, GVar.actor, "#ff0");
};
//Actor action
Actor.prototype.act = function () {
    var freeWays = Game.map.getFreeWays(this._x, this._y);
    var cell     = ROT.RNG.getUniformInt(1, freeWays.length - 1);
    var [x, y] = Common.key2xy(freeWays[cell]);
    //Add pheromones to this cell
    Game.map._cells[freeWays[0]].update(true);
    this._x = x;
    this._y = y;
    this._draw();
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
    this._createActor();
};

ActorSpawn.prototype._draw = function () {
    this.freeWays = Game.map.getFreeWays(this._x, this._y);
    Game.display.draw(this._x, this._y, GVar.spawn);
};

ActorSpawn.prototype._createActor = function () {
    var key    = this.freeWays[1];
    var [x, y] = Common.key2xy(key);
    for(var i = 0; i < GVar.actorsCount; i++) {
        var actor  = new Actor(x, y);
        this._actors.push(actor);
    }
};
//Main Actors life cycle
ActorSpawn.prototype.act = function () {
    Game.engine.lock();
    function wrap() {
        Game.map.act();
        this._draw();
        for(var i = 0; i < this._actors.length; i++)
            this._actors[i].act();
        Game.engine.unlock();
    };
    setTimeout(wrap.bind(this), GVar.timeout);
};

var Cell = function (x, y, isFree, tile, pheromone) {
    this._x         = x;
    this._y         = y;
    this._isFree    = isFree;
    this._tile      = tile;
    this._pheromone = pheromone;
};

//Returns number between 0 and 9 or *, where 0 means cell doesn't have pheromones
//and * means maximum pheromone on cell
Cell.prototype._calculatePheromones = function () {
    if (this._pheromone > GVar.pheromoneMax) this._pheromone = GVar.pheromoneMax;
    if (this._pheromone < 0) this._pheromone = 0;
    
    var number = Math.round((this._pheromone/GVar.pheromoneMax)*10);
    if (number < 9)
        return number.toString();
    else
        return '*'; //TODO add to GVar
};

//If first parameter is true increase _pheromone by delta
//otherwise decrease _pheromone by delta
Cell.prototype.update = function (increase) {
    if (increase) {
        this._pheromone += GVar.pheromoneIncr;
    } else {
        if(this._pheromone != 0)
            this._pheromone -= GVar.pheromoneDecr;
    }
};

Cell.prototype.act = function () {
    this.update(false);
};

Cell.prototype._draw = function () {
    var pheromoneCount;
    if(this._pheromone && this._isFree) {
        pheromoneCount = this._calculatePheromones();
        Game.display.draw(this._x, this._y, pheromoneCount);
    } else {
        Game.display.draw(this._x, this._y, this._tile);
    }
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
        var isFree = false;
        if (isItWall) {
            tile = GVar.wall;
            isFree = false;
        } else {
            tile = GVar.space;
            this._freeCells.push(key);
            isFree = true;
        }
        
        this._cells[key] = new Cell(x, y, isFree, tile, 0);
    };
    //generation starts here
    var arena = new ROT.Map.IceyMaze(this._width, this._height);
    arena.create(mapCallback.bind(this));
};

//Draw map
Map.prototype._draw = function () {
    for(var key in this._cells) {
        //var [x, y] = Common.key2xy(key);
        //Game.display.draw(x, y, this._cells[key]);
        this._cells[key]._draw();
    }
};

//If cell from x,y coordinate isn't wall return true
Map.prototype._isVisible = function (x, y) {
    var key = Common.xy2key(x, y);
    return this._freeCells.indexOf(key) != -1;
};

//
Map.prototype._calculateView = function (x, y, r) {
    var fov = new ROT.FOV.DiscreteShadowcasting(this._isVisible.bind(this));
    var result = [];
    var viewCallback = function (x, y, r, visible) {
        if(visible) {
            var key = Common.xy2key(x, y);
            this.push(key);
            //var tile = Game.map._cells[key]._tile;
            //Game.display.draw(x, y, tile, '#ff0');
        }
    };
    
    fov.compute(x, y, r, viewCallback.bind(result));
    
    return result;
};

//Get cells for move
Map.prototype.getFreeWays = function (x, y) {
    var visibleCells = this._calculateView(x, y, 1);
    var result = [];
    
    for(var i = 0; i < visibleCells.length; i++) {
      var key = visibleCells[i];
      var [x, y] = Common.key2xy(key);
      var visible = this._isVisible(x, y);
      if(visible) {
        
        result.push(key);
      }
    }
    
    return result;
};

Map.prototype.getRandomEmptyCell = function () {
    var index = Math.floor(ROT.RNG.getUniform() * this._freeCells.length);
    var key = this._freeCells[index];
    return Common.key2xy(key);
};

Map.prototype.act = function () {
    //Todo: Need some kind of optimization
    for (var i = 0; i < this._freeCells.length; i++) {
        var key = this._freeCells[i];
        this._cells[key].act();
    }
    this._draw();
};
//Game
var Game = {
    display: null,
    
    options: {},
    
    scheduler: null,
    engine:   null,
    
    map: null,
        
    init: function () {
        this.display = new ROT.Display(this.options);
        document.body.appendChild(this.display.getContainer());
        //Get current option
        this.options = this.display.getOptions();
        //Map initialization
        this.map = new Map(this.options.width, this.options.height);
        //Actor's initialization
        var [x, y] = this.map.getRandomEmptyCell();
        var player = new ActorSpawn(x, y);
        //Game loop initialization
        this.scheduler = new ROT.Scheduler.Simple();
        this.scheduler.add(player, true);
        this.engine   = new ROT.Engine(this.scheduler);
        this.engine.start();
    }
}

