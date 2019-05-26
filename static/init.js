document.onreadystatechange = () => { 
  if (document.readyState == "complete") { 
	$('.ui.dropdown').dropdown();
  } 
} 
