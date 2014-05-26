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


		var colourscheme = {
			browns: function(a) {
				var b, g, r;
				if (a == null) {
					a = 0.8;
				}
				r = Math.floor(Math.random() * 100) + 100;
				g = (Math.floor(Math.random() * 3) + 2) * 25;
				b = 49;
				return "rgba(" + r + "," + g + "," + b + "," + a + ")";
			},
			reds: function(a) {
				var b, g, r;
				if (a == null) {
					a = 0.8;
				}
				r = Math.floor(Math.random() * 100) + 100;
				g = 44;
				b = 49;
				return "rgba(" + r + "," + g + "," + b + "," + a + ")";
			},
			blues: function(a) {
				var b, g, r;
				if (a == null) {
					a = 0.8;
				}
				r = Math.floor(Math.random() * 50) + 30;
				g = Math.floor(Math.random() * 30) + 100;
				b = 180;
				return "rgba(" + r + "," + g + "," + b + "," + a + ")";
			},
			bluebrowns: function(a) {
				if (a == null) {
					a = 0.8;
				}
				if (Math.round(Math.random())) {
					return colourscheme.blues(a);
				} else {
					return colourscheme.browns(a);
				}
			}
		};

		random_data = function() {
			var animals = [
				"toronto",
				"buffalo",
				"hamilton",
				"edmonton",
				"miami",
				"chicago",
				"detroit",
				"paris",
				"london",
				"kingston",
				"peterburough",
			]
			var adjectives = [
				"quiet",
				"happy",
				"almost",
				"waiting",
				"plenty",
				"dogged",
			]

			var arr, i, length;
			arr = [];
			length = 4;
			// length = (Math.random() * 15) + 7;
			i = 0;
			while (i < length) {
				var label = adjectives[parseInt(Math.random() * adjectives.length)]
				label += " " + animals[parseInt(Math.random() * animals.length)]
				arr.push({
					value: parseInt(Math.random() * 100) + 1,
					label: label,
					color: colourscheme.bluebrowns(0.7)
				});
				i++;
			}
			return arr
		};


		var Clooney = require('./src/coffeejs/clooney');
		data = random_data()
		window.g = new Clooney({
			data: data,
			width: 400,
			height: 400,
			align: "start",
			type: "treemap",
			// type: "area_bar",
			// type: "vertical_bar",
			// type: "horizontal_bar",
			hidden: false
		})
		console.log(g)
		graph_view = g.build()


		////toools
		////

		button = function(str, obj, method) {
			var s = new Surface({
				size: [100, 20],
				content: str,
				properties: {
					color: "steelblue",
					cursor: "pointer",
					border: "1px solid lightsteelblue"
				}
			})
			s.on('click', function() {
				if (Object.keys(obj).length > 0)
					g.update(obj)
				if (method) {
					g[method]()
				}
			})
			return s
		}

		align = function() {
			var v = new SequentialLayout({
				direction: 1,
				properties: {
					border: "1px solid steelblue"
				}
			})
			title = new Surface({
				size: [150, 20],
				content: "align:",
				properties: {
					color: "grey"
				}
			})
			start = button('start', {
				align: "start"
			})
			middle = button('middle', {
				align: "middle"
			})
			end = button('end', {
				align: "end"
			})
			var arr = [title, start, middle, end]
			v.sequenceFrom(arr)
			return v
		}
		type = function() {
			var v = new SequentialLayout({
				direction: 1,
			})
			title = new Surface({
				size: [150, 20],
				content: "type:",
				properties: {
					color: "grey"
				}
			})
			horizontal = button('horizontal_bar', {
				type: "horizontal_bar"
			})
			vertical = button('vertical_bar', {
				type: "vertical_bar"
			})
			area = button('area_bar', {
				type: "area_bar"
			})
			treemap = button('treemap', {
				type: "treemap"
			})
			var arr = [title, vertical, horizontal, area, treemap]
			v.sequenceFrom(arr)
			return v
		}

		events = function() {
			var v = new SequentialLayout({
				direction: 1,
			})
			title = new Surface({
				size: [150, 20],
				content: "events:",
				properties: {
					color: "grey"
				}
			})
			sort = button('sort', {}, 'sort')
			random = button('randomize', {}, 'randomize')
			wave = button('wave', {}, 'wave')
			walk = button('random_walk', {}, 'random_walk')
			append = button('append', {})
			append.on('click', function() {
				g.append({
					value: parseInt(Math.random() * 95),
					color: "rgba(42,111,180,0.7)"
				})
			})
			var arr = [title, sort, random, wave, walk, append]
			v.sequenceFrom(arr)
			return v
		}
		showhide = function() {
			var v = new SequentialLayout({
				direction: 1,
			})
			title = new Surface({
				size: [150, 20],
				content: "show/hide:",
				properties: {
					color: "grey"
				}
			})
			show = button('show', {}, 'show')
			hide = button('hide', {}, 'hide')
			var arr = [title, show, hide]
			v.sequenceFrom(arr)
			return v
		}

		control_view = function() {
			hor = new SequentialLayout({
				direction: 0
			})
			var facets = [type(), align(), events(), showhide()]
			hor.sequenceFrom(facets)
			return hor
		}


		vert = new SequentialLayout({
			direction: 1
		})
		var arr = [control_view(), graph_view]
		vert.sequenceFrom(arr)

		// g.random_walk()


		// Timer.after(function() {
		// console.log('hi')
		// g.put({
		// value: Math.random() * 95,
		// label: "fun"
		// })
		// 	g.resize({
		// 		width: 600,
		// 		height: 600,
		// 	})
		// g.wave()
		// g.random_walk()
		// }, 50)
		// Timer.after(function() {
		// g.sort(function(a, b) {
		// 	return Math.random()
		// })
		// }, 80)
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

		mainContext.add(vert)
	})