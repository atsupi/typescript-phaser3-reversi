/********************************************************
 Title: Reversi game in TypeScript using Phaser3 library
 Filename: main.ts
 Copyright (c) 2023 atsupi
*********************************************************/

import Phaser from "phaser";

const D_WIDTH = 480;
const D_HEIGHT = 320;

const map = [
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [3, 0, 0, 0, 1, 2, 0, 0, 0, 3],
    [3, 0, 0, 0, 2, 1, 0, 0, 0, 3],
    [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
];

class PreLoad extends Phaser.Scene {
    constructor() {
        super({ key: "PreLoad", active: true });
    }

    preload = () => {
        this.load.spritesheet("turning", "./assets/turn_anim.png", { frameWidth: 32, frameHeight: 32 });
    }

    create = () => {
        this.anims.create({
            key: "turntowhite",
            frames: this.anims.generateFrameNumbers("turning", { start: 0, end: 8 }),
            hideOnComplete: true,
            repeat: 1
        });
        this.anims.create({
            key: "turntoblack",
            frames: this.anims.generateFrameNumbers("turning", { start: 8, end: 16 }),
            hideOnComplete: true,
            repeat: 1
        });
        this.scene.start("MyScene1");
    }
}

class MyScene1 extends Phaser.Scene {
    constructor() {
        super({ key: "MyScene1", active: false });
    }

    create = () => {
        let text = this.add.text(100, 100, "Phaser 3").setFontSize(48).setColor('#00f');
        let timer = this.time.delayedCall(1000, () => {
            this.scene.start("MyScene2");
        });
    }
}

class MyScene2 extends Phaser.Scene {
    turn: number = 0; // 0=black, 1=white
    rest: number = 0;
    numBlack: number = 2;
    numWhite: number = 2;
    player: null;
    player2: null;
    tilemap: any;
    tiles: any;
    layer: any;
    graphics: any;
    textBlack: any;
    textWhite: any;
    textCursor: any;
    textResult: any;
    textRestart: any;
    textSkip: any;
    groupTurning: any;

    constructor() {
        super({ key: "MyScene2", active: false });
        this.player = null;
        this.player2 = null;
        this.resetGame();
    }

    preload = () => {
        this.load.image("tileimage", "./assets/maptile.png");
    }

    create = () => {
        this.tilemap = this.make.tilemap({
            data: map,
            tileWidth: 32,
            tileHeight: 32,
        });
        this.tiles = this.tilemap.addTilesetImage("tileimage");
        this.layer = this.tilemap.createLayer(0, this.tiles, 0, 0);

        this.graphics = this.add.graphics();
        this.textBlack = this.add.text(354, 100, "Black:" + this.numBlack).setFontSize(20).setColor('#ff0');
        this.textWhite = this.add.text(354, 140, "White:" + this.numWhite).setFontSize(20).setColor('#ff0');
        this.textCursor = this.add.text(330, (this.turn == 0) ? 100 : 140, "▶").setFontSize(20).setColor("#fff");
        this.textResult = this.add.text(64, 142, "").setFontSize(36).setColor('#0f0').setShadow(2, 2).setFontStyle("Bold").setAlpha(0.8);
        this.textRestart = this.add.text(354, 248, "Restart").setFontSize(20).setColor('#faa').setInteractive();
        this.textRestart.on("pointerdown", (pointer: any) => {
            this.textRestart.setText("OK!");
            this.resetGame();
            this.scene.start('MyScene3');
        }, this);
        this.textSkip = this.add.text(354, 276, "Skip").setFontSize(24).setColor('#aaf').setInteractive();
        this.textSkip.on("pointerdown", () => {
            this.turn = 1 - this.turn;
        }, this);

        const createCallback = (sprite: Phaser.GameObjects.GameObject) => {
            if (sprite.parentContainer) {
                sprite.setName(`sprite${sprite.parentContainer.length}`);
            }
            console.log("created", sprite.name);
        }
        this.groupTurning = this.add.group({
            defaultKey: "turning",
            maxSize: 18,
            createCallback: (sprite: Phaser.GameObjects.GameObject) => {
                createCallback(sprite);
            },
            removeCallback: (sprite: Phaser.GameObjects.GameObject) => {
                console.log("removed", sprite.name);
            },
        });
    }

    update = () => {
        this.graphics.fillStyle(0x123456);
        this.graphics.fillRect(320, 0, 480, 320);
        this.textBlack.setText("Black:" + this.numBlack);
        this.textWhite.setText("White:" + this.numWhite);
        this.textCursor.setPosition(330, (this.turn == 0) ? 100 : 140);
        if (this.numBlack + this.numWhite == 64) {
            if (this.numBlack == this.numWhite) {
                this.textResult.setText("Draw");
            } else {
                this.textResult.setText(((this.numBlack > this.numWhite) ? "Black" : "White") + " Won");
            }
            return;
        }
        this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            const d = this.tilemap.getTileAtWorldXY(pointer.worldX, pointer.worldY, true);
            if (d && d.index == 0 && d.x > 0 && d.x < 9 && d.y > 0 && d.y < 9) {
                const tile_index = d.index;
                const posX = d.x;
                const posY = d.y;
                if (tile_index == 0) {
                    if (this.turn == 0) {
                        // can black be put?
                        const gain = this.turnAllDishAtLine(1, posX, posY);
                        if (gain > 0) {
                            this.tilemap.putTileAt(1, posX, posY);
                            // change turn
                            this.numBlack += gain + 1;
                            this.numWhite -= gain;
                            this.turn = 1;
                            this.rest--;
                        }
                    } else {
                        // can white be put?
                        const gain = this.turnAllDishAtLine(2, posX, posY);
                        if (gain > 0) {
                            this.tilemap.putTileAt(2, posX, posY);
                            // change turn
                            this.numBlack -= gain;
                            this.numWhite += gain + 1;
                            this.turn = 0;
                            this.rest--;
                        }
                    }
                }
            }
        });
    }

    resetGame = () => {
        this.turn = 0; // 0=black, 1=white
        this.rest = 8 * 8 - 4;
        this.numBlack = 2;
        this.numWhite = 2;
    }

    turnDishAtLine = (turn: number, originX: number, originY: number, deltaX: number, deltaY: number) => {
        const turnOp = 3 - turn;
        let gain = 0;
        for (let i = 1; i < 8; i++) {
            let tileMap = this.tilemap.getTileAt(originX + deltaX * i, originY + deltaY * i);
            if (tileMap) {
                let tile = tileMap.index;
                if (tile == turnOp) {
                    gain++;
                } else if (tile == turn) {
                    break;
                } else if (tile == 0 || tile >= 3) {
                    gain = 0;
                    break;
                }
            }
        }
        for (let i = 1; i < gain + 1; i++) {
            this.tilemap.putTileAt(turn, originX + deltaX * i, originY + deltaY * i);
            this.addTurnToAnims(turn - 1, originX + deltaX * i, originY + deltaY * i);
        }
        return gain;
    }

    turnAllDishAtLine = (turn: number, originX: any, originY: any) => {
        const deltas = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 },
        ];
        let gain = 0;
        deltas.forEach((delta) => { gain += this.turnDishAtLine(turn, originX, originY, delta.x, delta.y) });
        return gain;
    }

    activateAnims = (turn: number, sprite: Phaser.GameObjects.Sprite) => {
        if (turn == 0) {
            sprite.anims.play("turntoblack", true);
        } else {
            sprite.anims.play("turntowhite", true);
        }
        sprite.setVisible(true).setActive(true);

        const animRepeatCallback = (sprite: Phaser.GameObjects.Sprite) => {
            if (sprite) {
                sprite.setVisible(false).setActive(false);
                if (this.groupTurning) {
                    this.groupTurning.remove(sprite);
                }
            }
        }

        sprite.on("animationrepeat", (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame, gameObject: Phaser.GameObjects.Sprite) => {
            animRepeatCallback(gameObject);
        }, this);
    }

    addTurnToAnims = (turn: number, x: any, y: any) => {
        const info = this.tilemap.getTileAt(x, y);
        if (info) {
            const sprite = this.groupTurning.get(info.pixelX, info.pixelY).setOrigin(0, 0);
            if (sprite) {
                this.activateAnims(turn, sprite);
            }
        }
    }
}

class MyScene3 extends Phaser.Scene {
    constructor() {
        super({ key: "MyScene3", active: false });
    }

    create = () => {
        const text = this.add.text(100, 100, "Game Clear").setFontSize(48).setColor('#ff0');
        const timer = this.time.delayedCall(2000, () => {
            this.scene.start("MyScene1");
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: D_WIDTH,
    height: D_HEIGHT,
    antialiases: false,
    physics: {
        default: "arcade",
        arcade: {
            debug: true,
            gravity: { y: 300 }
        }
    },
    fps: {
        target: 24,
        forceSetTimeOut: false
    },
    scene: [PreLoad, MyScene1, MyScene2, MyScene3],
}

const phaser = new Phaser.Game(config);
