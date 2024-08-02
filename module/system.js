export class CbrSettings {
	static register() {
		game.settings.register("CBRPNK", "wiedModule", {
			name: "Wierd",
			hint: "Setting to add Wierd options to character sheets.",
			scope: "world",
            config: true,
			type: Boolean,
			default: false,
			requiresReload: true
		});
	}
}
