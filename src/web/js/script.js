function listClick(element) {
    var liste = document.getElementById("liste");
    var ancienActif = liste.getElementsByClassName("active");
    element.className = "list-group-item list-group-item-action active";
     ancienActif.className = "list-group-item list-group-item-action";
    console.log(element.className);
}