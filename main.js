	define(function(require, exports, module) {

		var Engine = require('famous/core/Engine');
		var Transform = require('famous/core/Transform');
		var Modifier = require('famous/core/Modifier');
		var Surface = require('famous/core/Surface');
		var Transitionable = require('famous/transitions/Transitionable');
		var Easing = require('famous/transitions/Easing');
		var Timer = require('famous/utilities/Timer');
		var ToggleButton = require('famous/widgets/ToggleButton');
		var SequentialLayout = require("famous/views/SequentialLayout");
		var mainContext = Engine.createContext();

		random_data = function() {
			var arr, i, length;
			arr = [];
			length = (Math.random() * 35) + 15;
			i = 0;
			while (i < length) {
				arr.push({
					value: parseInt(Math.random() * 100) + 1,
					label: ""
				});
				i++;
			}
			return arr;
		};


		var Clooney = require('./src/coffeejs/clooney');
		data = random_data()
		window.g = new Clooney({
			data: data,
			width: 400,
			height: 400,
			align: "start",
			// type: "vertical_bar"
			type: "horizontal_bar"
		})
		console.log(g)
		view = g.build()


		Timer.after(function() {
			g.update({
				type: "vertical_bar"
			})
		}, 80)

		// Timer.after(function() {
		// 	g.update({
		// 		align: "middle"
		// 	})
		// }, 80)

		// Timer.after(function() {
		// 	data[3].value += 100
		// 	g.update({
		// 		data: data
		// 	})
		// }, 80)

		mainContext.add(view)
	})