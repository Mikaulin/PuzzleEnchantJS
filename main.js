enchant();

var arBoxes;

/*Directories*/
var dImages = "images/";
var dMusic = "music/";
var physicsWorld;

/*Sprites*/
var setBoxes = dImages + 'blocksObject.png';
var groundPixel = dImages + 'groundPix.png';

/*Sounds*/
var fxBoxContact = dMusic + 'FX053.mp3';
var fxBoxClick = dMusic + 'boxClick.wav';

/*Sizes*/
var wGame = 320;
var hGame = 320;
var wBox = 32;
var hBox = 32;
var scene;


window.onload = function () {
	game = new Game(wGame, hGame);
	game.score = 0;
	game.preload(setBoxes, groundPixel, fxBoxContact, fxBoxClick);

    game.multiplier = 1;
    game.lastChainTime = 0;

	game.onload = function () {
 		scene = new Scene();
        //Al rootScene le asigno la que acabamos de crear
        
        arBoxes = new Array();
        game.pushScene(scene);
        //physicsWorld = new PhysicsWorld(0, 9.8);

 		scene.addEventListener('enterframe', function() {
	        //Anvanzar simulacion física
            //physicsWorld.step(game.fps);
	        });	
        //var b = new PhyBox(150, 2, game.rootScene);
        var b = new Box(160, 2);
        //addGround();

        //DEBUG
        //Genera cajas de forma aleatoria
        //Vamos a tener un Grid de wGame/wBox posiciones
        //Que para colocar en el eje X multiplicamos por wBox
        scene.addEventListener('touchstart', function () {
            //var b = new PhyBox(150, 2, game.rootScene);
            var posGrid = wGame / wBox;
            var posBox = rand(posGrid);
            var b = new Box(posBox*wBox, rand(5));
            //test
            //var b = new Box(160, rand(5));
        });
	};
	game.start();
}

/**
 * Clase para objetos Box
 */
var Box = enchant.Class.create(enchant.Sprite, {
    initialize: function (x, frame) {
        enchant.Sprite.call(this, wBox, hBox);
        this.image = game.assets[setBoxes];
        this.x = x;
        this.y = 0;
        this.frame = frame;
        this.moveSpeed = 5;
        //Los de mismo tipo (frame) se anulan
        this.tipo = frame;        
        //Devuelve 0 si no hay elementos
        this.arrPosition = arBoxes.length;
        arBoxes[this.arrPosition] = this;
        
        this.addEventListener('enterframe', function () {

             //Colisiones entre elementos Box
            for (var i in arBoxes) {
                if(arBoxes[i].within(this, wBox+1) && arBoxes[i] != this) {
                   //Si son del mismo tipo las eliminamos
                    if(this.tipo == arBoxes[i].tipo) {
                        arBoxes[i].remove();
                        this.remove();
                        game.score += game.multiplier * 5;

                        //Aumentar el valor del multiplier si el tiempo de diferencia con el anterior evento <=3seg
                        
                        if (game.currentTime - game.lastChainTime <= 3000) {
                            if(game.multiplier < 5) {
                                game.multiplier++;
                            }
                        }
                        else
                        {
                            game.multiplier = 1;
                        }
                        game.lastChainTime = game.currentTime;
                        break;
                    }            
                }

                //Si la distancia entre los elementos que colisiones es hBox la velocidad a 0
                if(this.within(arBoxes[i], hBox) && arBoxes[i] != this) {
                    //tenemos que parar solo cuando esa distancia exista en el eje Y (positivo) 
                    //Si this está encima en eje de las Y                    
                    if (this.y < arBoxes[i].y) {
                        this.moveSpeed = 0;
                        arBoxes[i].moveSpeed = 0;
                        break;
                    }                    
                }
                else
                {
                    this.moveSpeed = 5;
                    arBoxes[i].moveSpeed = 5;
                }
            }
            if(this.y < hGame-hBox) {
                //this.remove(game.rootScene);
                this.y += this.moveSpeed;
            }
        });
        //Eliminamos cuando tocamos la caja
        this.addEventListener('touchstart', function () {
            this.remove(1);
            
        });
        scene.addChild(this);

    },
    remove: function (deleteType) {
        if (deleteType == "1") {
            //Sonido de contacto entre dos cajas
            game.assets[fxBoxClick].play();
        }
        else
        {
            //Sonido de contacto entre dos cajas
            game.assets[fxBoxContact].play();
        }
        
        //En la posicion a eliminar b elementos
        arBoxes.splice(this.arrPosition, 1);
        //Hay que actualizar las posiciones de los elementos del array
        for (var i in arBoxes) {
            arBoxes[i].arrPosition = i;
        }
        scene.removeChild(this);
        delete this;
    }
});

/**
 * Clase para objetos Box con Física
 * No me sirve de mucho por la fricción y demás detalles
 */
var PhyBox = enchant.Class.create(PhyBoxSprite, {
    initialize: function (x, frame) {
        var box = new PhyBoxSprite(32, 32, enchant.box2d.DYNAMIC_SPRITE, 1, 0, 0, true);
        box.image = game.assets[setBoxes];
        box.frame = frame;
        box.position = { x: x, y: 0 };
        box.vx = 0;
        box.vy = 10;
        box.ax = 0;
        box.ay = 0;
        //Los de mismo tipo (frame) se anulan
        box.tipo = frame;
        //box.applyImpulse(new b2Vec2(Math.random(), 0));
        box.addEventListener('touchstart', function () {
            //console.log(this.y);
            box.destroy();
            //En la posicion a eliminar b elementos
            arBoxes.splice(box.arrPosition, 1);
        });
        box.addEventListener('enterframe', function () {
            //Mantener el ángulo a 0 para evitar giros
            box.angle = 0;
            //Y mentener siempre el valor de x para que no se mueva
            box.x = x;

            //Colisiones entre elementos Box
            for (var i in arBoxes) {
                        //console.log(i);
                        if(box.intersect(arBoxes[i]) && arBoxes[i] != box) {
                            //Si son del mismo tipo las eliminamos
                            if(box.tipo == arBoxes[i].tipo) {
                                box.destroy();
                                var bCol = arBoxes[i];
                                bCol.destroy();
                                arBoxes.splice(i, 1);
                                //game.rootScene.removeChild(this);
                                //game.rootScene.removeChild(bCol);
                                break;
                            }
                        }
                    }
        });
        //También hay que parar en Y cuando colisiona contra otro Box
        //Base 0
        arBoxes[arBoxes.length] = box;
        box.arrPosition = arBoxes.length;
        game.rootScene.addChild(box);
    }
});

/**
 * Función para añadir "suelo"
 */
 function addGround()
 {
    for(var i = 0; i < wGame; i++){
            //Generamos el suelo de wGame casillas
            var floor = new PhyBoxSprite(1, 1, enchant.box2d.STATIC_SPRITE, 1, 0, 0, true);
            floor.image = game.assets[groundPixel];
            //Número de Frame del Sprite
            floor.frame = 0;
            floor.position = { x: i*1, y: hGame };
            game.rootScene.addChild(floor);
    }
 }

 function rand(num){
    return Math.floor(Math.random() * num);
}