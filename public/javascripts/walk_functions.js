function center_bias(me) {
  me.delta_x = Math.abs(me.x-X_MAX/2)/(X_MAX/2)
  me.delta_y = Math.abs(me.y-Y_MAX/2)/(Y_MAX/2)
  me.y_prob  = me.delta_x ? me.delta_y/me.delta_x : 10
  var pref_x = 1, pref_y = 1;
  if(me.x > X_MAX/2) {pref_x = -1}
  if(me.y > Y_MAX/2) {pref_y = -1}
  var p = Math.random()*(me.y_prob+1);
  if(p < 1) {
    if(Math.random() < 0.25) {
      me.move_to('x', pref_x*(-1));
    } else {
      me.move_to('x', pref_x);
    }
  } else {
    if(Math.random() < 0.25) {
      me.move_to('y', pref_y*(-1));
    } else {
      me.move_to('y', pref_y);
    }
  }
}
function outward_bias(me) {
  basic_walk(me);
  /*me.delta_x = Math.abs(me.x-X_MAX/2)/(X_MAX/2)
  me.delta_y = Math.abs(me.y-Y_MAX/2)/(Y_MAX/2)
  me.y_prob  = me.delta_x ? me.delta_y/me.delta_x : 10
  var pref_x = -1, pref_y = -1;
  if(me.x > X_MAX/2) {pref_x = 1}
  if(me.y > Y_MAX/2) {pref_y = 1}
  var p = Math.random()*(me.y_prob+1);
  if(p < 1) {
    if(Math.random() < 0.25) {
      me.move_to('x', pref_x*(-1));
    } else {
      me.move_to('x', pref_x);
    }
  } else {
    if(Math.random() < 0.25) {
      me.move_to('y', pref_y*(-1));
    } else {
      me.move_to('y', pref_y);
    }
  }*/
}
function upward_bias(me) {
  var direction = Math.floor(Math.random()*4)

  switch(direction) {
    case 0: me.move_to('x', -1);  break;
    case 1: me.move_to('x',  1);  break;
    case 2 || 3: me.move_to('y', -1);  break;
    //case 3: me.move_to('y',  1);  break;
  } 
}
function basic_walk(me) {
  var direction = Math.floor(Math.random()*4)

  switch(direction) {
    case 0: me.move_to('x', -1);  break;
    case 1: me.move_to('x',  1);  break;
    case 2: me.move_to('y', -1);  break;
    case 3: me.move_to('y',  1);  break;
  } 
}
