const mongoose= require('mongoose');


const ConnectDB= async()=>{
 try{
    await mongoose.connect('');
    console.log('Database connection Sucess');

 }
 catch{
    console.log('failed to connect with database');
 }
}
module.exports=ConnectDB();