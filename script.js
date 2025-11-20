
const backend = "https://tb33.onrender.com";

function startTracking(){
    const id = document.getElementById("videoId").value;
    if(!id) return alert("Enter video ID");

    fetch(`${backend}/track?id=${id}`);
    update(id);
    setInterval(()=>update(id), 300000);
}

function update(id){
    fetch(`${backend}/latest?id=${id}`)
    .then(r=>r.json())
    .then(d=>{
        document.getElementById("live").innerHTML =
        `Views: ${d.views} <br> Likes: ${d.likes}`;

        let row = `<tr><td>${d.time}</td><td>${d.views}</td><td>${d.likes}</td></tr>`;
        document.getElementById("history").innerHTML += row;
    });
}
