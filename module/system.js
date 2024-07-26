export class CbrSettings {
	static register() {
		game.settings.register("cbr", "wiedModule", {
			name: "Wierd",
			hint: "Tags that are shared between all users.",
			scope: "world",
            config: true,
			type: Boolean,
			default: false,
		});
	}
}
