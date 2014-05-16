class Scale
  constructor:(obj={}) ->
    @size = obj.size or [0, 200]
    @range = obj.range or [0, 100]
  linear: (num) ->
    the= this
    full_range = the.range[1] - the.range[0]
    range_percentage = num / the.range[1]
    full_size = the.size[1] - the.size[0]
    return (range_percentage * full_size) + the.size[0] #this has some bugs at size=0

