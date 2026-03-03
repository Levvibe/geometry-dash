export default class LevelLoader {
  constructor(scene) { this.scene = scene; }

  async load(key) {
    const data = await fetch(`levels/${key}.json`).then(r => r.json());
    return data;
  }

  build(level) {
    const s = this.scene;
    s.platforms = s.physics.add.staticGroup();
    s.hazards = s.physics.add.staticGroup();
    s.portals = s.physics.add.staticGroup();
    s.rings = s.physics.add.staticGroup();
    s.pads = s.physics.add.staticGroup();

    for (const o of level.objects) {
      const sprite = s.add.rectangle(o.x, o.y, o.w || o.radius * 2 || 36, o.h || o.radius * 2 || 36, 0x3344aa).setOrigin(0.5);
      s.physics.add.existing(sprite, true);
      sprite.objType = o.type;
      sprite.props = o;

      if (o.type.startsWith('platform')) { sprite.fillColor = 0x2b3578; s.platforms.add(sprite); }
      else if (o.type.startsWith('hazard')) { sprite.fillColor = 0xff3f69; s.hazards.add(sprite); }
      else if (o.type.startsWith('portal')) { sprite.fillColor = 0x38ffe3; s.portals.add(sprite); }
      else if (o.type.startsWith('ring')) { sprite.fillColor = 0xf8f26d; s.rings.add(sprite); }
      else if (o.type.endsWith('pad')) { sprite.fillColor = 0xa867ff; s.pads.add(sprite); }
    }
  }
}
