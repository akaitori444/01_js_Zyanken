// =============================================================================
// じゃんけん要素
// =============================================================================
let janken_end = 0;

function R_Click(p_janken_r) {
    let janken = ['グー','チョキ','パー',];//"janken"のリストを作成
    let janken_r = Math.floor( Math.random() * janken.length);
    let p_janken = ['グー','チョキ','パー'];//"プレイヤーのjanken"を作成


        //勝ち負けの判定
        if (janken_r === p_janken_r) {
            Result_end = "じゃんけんに引き分け！今は勝てない……";
            janken_end = 0;
        }else if(p_janken_r === 0 && janken_r === 1) 
        {
            Result_end = "じゃんけんに勝利！攻撃チャンス！";
            console.log('じゃんけんに勝ちました');
        }else if(p_janken_r === 1 && janken_r === 2) 
        {
            Result_end = "じゃんけんに勝利！攻撃チャンス！";
            janken_end = 1;
        }else if(p_janken_r === 2 && janken_r === 0) 
        {
            Result_end = "じゃんけんに勝利！攻撃チャンス！";
            console.log('じゃんけんに勝ちました');
            janken_end = 1;
        }else {
            Result_end = "じゃんけんに敗北！今は勝てない……";
            console.log('じゃんけんに負けました');
            janken_end = 0;
        }

        //結果を表示するためのプログラム
        document.getElementById("jankenpon").src="jan" + janken_r + ".png";
        document.getElementById("Rejan1").innerHTML = p_janken[p_janken_r] +"を選択しました。";
        document.getElementById("Rejan2").innerHTML = "相手は" + janken[janken_r] +"結果は"+ Result_end;
        document.getElementById("jankenpon2").src="jan" + p_janken_r + ".png";
}
/*----------------------------------------------------------------------------------*/ 
// =============================================================================
// スプライト
// =============================================================================

//
// キャラクターのスプライト
//
function Hero(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);

    // 物理的特性
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;

    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true); // 8fps ループ
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
}

// Phaser.Spriteから継承
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
    const SPEED = 200;
    this.body.velocity.x = direction * SPEED;

    // 画像の反転とアニメーションを更新
    if (this.body.velocity.x < 0) {
        this.scale.x = -1;
    }
    else if (this.body.velocity.x > 0) {
        this.scale.x = 1;
    }
};

Hero.prototype.jump = function () {
    const JUMP_SPEED = 600;
    let canJump = this.body.touching.down;

    if (canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }

    return canJump;
};

Hero.prototype.bounce = function () {
    const BOUNCE_SPEED = 200;
    this.body.velocity.y = -BOUNCE_SPEED;
};

Hero.prototype.update = function () {
    // 変更が必要な場合は、スプライト アニメーションを更新します
    let animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
        this.animations.play(animationName);
    }
};

Hero.prototype._getAnimationName = function () {
    let name = 'stop'; // デフォルトのアニメーション

    // ジャンプ
    if (this.body.velocity.y < 0) {
        name = 'jump';
    }
    // 落下
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        name = 'fall';
    }
    else if (this.body.velocity.x !== 0 && this.body.touching.down) {
        name = 'run';
    }

    return name;
};
/*----------------------------------------------------------------------------------*/ 
//
// 蜘蛛の敵
//
function Spider(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');

    // アンカー
    this.anchor.set(0.5);
    // アニメーション
    this.animations.add('crawl', [0, 1, 2], 8, true); // 8fps, looped
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // 物理特性
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

// Phaser.Spriteから継承
Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
    // 壁を確認し、必要に応じて方向を逆にする
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Spider.SPEED; // 左折
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Spider.SPEED; // 右折
    }
};

Spider.prototype.die = function () {
    this.body.enable = false;

    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};
/*----------------------------------------------------------------------------------*/ 

// =============================================================================
// ゲームの状態
// =============================================================================

PlayState = {};

const LEVEL_COUNT = 4;

PlayState.init = function (data) {
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });

    this.keys.up.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);

    this.coinPickupCount = 0;
    this.hasKey = false;
    this.win = false;
    this.level = (data.level || 0) % LEVEL_COUNT;
};

PlayState.preload = function () {
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');
    this.game.load.json('level:2', 'data/level02.json');
    this.game.load.json('level:3', 'data/level03.json');
    
    this.game.load.image('font:numbers', 'images/numbers.png');

    this.game.load.image('background', 'images/background2.png');
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.image('key', 'images/key.png');

    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
/*
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
*/

    this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);

    this.game.load.audio('sfx:jump', 'audio/jump.wav');
    this.game.load.audio('sfx:coin', 'audio/coin.wav');
    this.game.load.audio('sfx:stomp', 'audio/stomp.wav');
    this.game.load.audio('sfx:key', 'audio/key.wav');
    this.game.load.audio('sfx:door', 'audio/door.wav');
};

PlayState.create = function () {
    // サウンド エンティティを作成
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        coin: this.game.add.audio('sfx:coin'),
        stomp: this.game.add.audio('sfx:stomp'),
        key: this.game.add.audio('sfx:key'),
        door: this.game.add.audio('sfx:door')
    };

    // レベルを作成
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));

    // スコアボードの作成
    this._createHud();
};

PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();

    //コインチェッカー
    this.coinFont.text = `x${this.coinPickupCount}`;
    this.keyIcon.frame = this.hasKey ? 1 : 0;
};

/*----------------------------------------------------------------------------------*/ 
//接触判定
PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);
    this.game.physics.arcade.collide(this.hero, this.platforms);

    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin,
        null, this);
    this.game.physics.arcade.overlap(this.hero, this.spiders,
        this._onHeroVsEnemy, null, this);
    this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey,
        null, this);
    this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,
        // キーがない場合、またはプレーヤーがオンエアの場合は無視します
        function (hero, door) {
            return this.hasKey && hero.body.touching.down;
        }, this);
};
/*----------------------------------------------------------------------------------*/ 

PlayState._handleInput = function () {
    if (this.keys.left.isDown) { // キャラを左に移動
        this.hero.move(-1);
    }
    else if (this.keys.right.isDown) { // キャラを右に移動
        this.hero.move(1);
    }
    else { // 止まる
        this.hero.move(0);
    }
};

PlayState._loadLevel = function (data) {
    // 必要なすべてのグループ/レイヤーを作成します
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;

    // すべてのプラットフォームを生成
    data.platforms.forEach(this._spawnPlatform, this);
    // キャラと敵を生成
    this._spawnCharacters({hero: data.hero, spiders: data.spiders});
    // オブジェクトを生成
    data.coins.forEach(this._spawnCoin, this);
    this._spawnDoor(data.door.x, data.door.y);
    this._spawnKey(data.key.x, data.key.y);

    // 重力を有効にする
    const GRAVITY = 1000;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;

    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    // アンカーと y 変位
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);
    // 物理的特性
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
    // 蜘蛛の出現
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);

    // 蜘蛛2の出現
/*
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
*/
    // 蜘蛛2の出現
/*
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
*/

    // キャラの出現
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);
};

//コイン
PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;

    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    // 物理学が衝突を検出できるようにして、ヒーローがキーを拾うことができるようにします
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;
    // トゥイーンを介して小さな「上下」アニメーションを追加する
    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};


PlayState._onHeroVsCoin = function (hero, coin) {
    this.sfx.coin.play();
    coin.kill();
    this.coinPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
    // 敵を倒すギミック
    if (hero.body.velocity.y > 0) { 
        hero.bounce();
        enemy.die();
        this.sfx.stomp.play();
    }
    // じゃんけん勝利時に敵を倒すギミック
    else if(janken_end = 1) { hero.bounce();enemy.die();this.sfx.stomp.play();}
    else { // ゲームオーバー→ゲーム再開
        this.sfx.stomp.play();
        this.game.state.restart(true, false, {level: this.level});
    }
};

PlayState._onHeroVsKey = function (hero, key) {
    this.sfx.key.play();
    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
    this.sfx.door.play();
    this.game.state.restart(true, false, { level: this.level + 1 });
};

PlayState._createHud = function () {
    const NUMBERS_STR = '0123456789X ';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR);

    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    let coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
    let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width,
        coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.add(coinScoreImg);
    this.hud.add(this.keyIcon);
    this.hud.position.set(10, 10);
};



// =============================================================================
// エントリーポイント
// =============================================================================
window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play', true, false, {level: 0});
};