
##clooney makes graphs with [famo.us](http://famo.us)

Clooney builds graphs quickly, and handles updates in a generic way.

using layout logic from [d3.js](http://d3js.org), it renders them with the [famo.us](http://famo.us) layout engine.

###here's [the demo](http://cdn.rawgit.com/spencermountain/clooney/master/build/index.html)

it's in early development. (May 2014)

it currently using the require.js-way, but i'll reduce this dependency soon.

named after george clooney.

## Generic Data format
```javascript
//a generic data format for all graphs
data= [{
	  value:30,
	  label:"Rivest",
	  color:"steelblue"
	},
	{
	  value:40,
	  label:"Shamir",
	  color:"darkred"
	},
	{
	  value:60,
	  label:"Adleman",
	  color:"lightsalmon"
  }]
```
## Generic Graph APi
```javascript
//compute the graph
graph = new Clooney({
	data: data,
	width: 400,
	height: 400,
	type: "horizontal_bar"
})

//put the graph (a container surface) in your app..
view = graph.build()
mainContext.add(view)

//then to update it..
g.update({
	align:"middle",
	type:"vertical_bar"
})
//they automatically animate with a 'wall' physics transition

//the to hide it..
g.hide()
```

## all options
```javascript
options= {
	data:[] //objects with a number as 'value'. change any value and it updates intellegently
	width:400//graph container width (and x-axis scale size)
	height:400//graph container height (and y-axis scale size)
	align:"start|middle|end" //start=left for horizontal charts, start=bottom for vertical charts
	type:"horizontal_bar|vertical_bar|area_bar|treemap" //the type of chart
	hidden: true|false //lets you control when it opens/closes
}
```

#Utility methods
they just wrap around 'g.update()', if you wanna use them
```javascript
g= new Clooney()

//show/hide the data
g.hide()
g.show()
//container size
g.resize({width:500})
g.resize({height:0})
//options.align
g.align('start')
g.align('middle')
g.align('end')
//ordering
g.sort()
g.sort(my_sort_method)
g.sort('desc')
g.randomize()//re-arrange randomly

//sugar
g.wave()//wiggle each value in a sequence
g.randomize()//change order at random
g.random_walk()//mindlessly guide things out of order
```

#Direct manipulation
if you're a badass, you can manipulate the divs manually, through the graph object aswell.
```javascript

g.bars[1].focus()

g.bars[1].height=800
g.bars[1].draw()
```

## Licence
[go-fer-it.](http://www.wtfpl.net/txt/copying/)
