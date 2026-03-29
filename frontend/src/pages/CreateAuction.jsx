import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import "./CSS/CreateAuction.css";

export default function CreateAuction(){

  const navigate = useNavigate();

  const [form,setForm] = useState({
    title:'',
    description:'',
    starting_price:'',
    bid_increment:'100',
    category:'',
    start_time:'',
    end_time:''
  });

  const [image,setImage] = useState(null);
  const [preview,setPreview] = useState(null);
  const [errors,setErrors] = useState({});
  const [showPopup,setShowPopup] = useState(false);
  const [submitting,setSubmitting] = useState(false);

  const handleChange = (e)=>{
    setForm({
      ...form,
      [e.target.name]:e.target.value
    });
  };

  const handleImage = (e)=>{
    const file = e.target.files[0];
    setImage(file);

    if(file){
      setPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    let newErrors = {};

    if (!form.title.trim()) newErrors.title = "กรุณากรอกชื่อสินค้า";
    if (!form.starting_price || !Number.isInteger(Number(form.starting_price)) || Number(form.starting_price) <= 0)
      newErrors.starting_price = "กรุณากรอกราคาเริ่มต้นเป็นจำนวนเต็มที่มากกว่า 0";
    if (!form.bid_increment || !Number.isInteger(Number(form.bid_increment)) || Number(form.bid_increment) <= 0)
      newErrors.bid_increment = "กรุณากรอกราคาขั้นต่ำต่อครั้งเป็นจำนวนเต็มที่มากกว่า 0";
    if (!form.description.trim()) newErrors.description = "กรุณากรอกรายละเอียด";
    if (!image) newErrors.image = "กรุณาอัปโหลดรูปสินค้า";
    if (!form.category.trim()) newErrors.category = "กรุณากรอกหมวดหมู่";
    if (!form.start_time.trim()) newErrors.start_time = "กรุณากรอกเวลาเริ่มประมูล";
    if (!form.end_time.trim()) newErrors.end_time = "กรุณากรอกเวลาปิดประมูล";

    const now = new Date();

    if (form.start_time && new Date(form.start_time) < now) {
      newErrors.start_time = "ไม่สามารถใส่เวลาเริ่มประมูลในอดีตได้";
    }

    if (form.end_time && new Date(form.end_time) < now) {
      newErrors.end_time = "ไม่สามารถใส่เวลาปิดประมูลในอดีตได้";
    }

    if (form.start_time && form.end_time && !newErrors.start_time && !newErrors.end_time && new Date(form.start_time) >= new Date(form.end_time)) {
      newErrors.end_time = "เวลาปิดประมูลต้องมากกว่าเวลาเริ่ม";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {

    if (!validate()) return;
    if (submitting) return;
    setSubmitting(true);

    let imageData = "";

    if (image) {
      imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });
    }

    const payload = {
      ...form,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      image: imageData
    };

    try{
      await api.post("/auctions",payload);

      setShowPopup(true);

      setTimeout(()=>{
        navigate("/home-seller");
      },1800);

    }catch(err){
      console.log(err);
      alert("เกิดข้อผิดพลาด");
      setSubmitting(false);
    }

  };

  return(
    <>
      <Navbar/>

      <div className="create-page">

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              สร้างรายการประมูลสำเร็จ!
            </div>
          </div>
        )}

        <span className="back-btn" onClick={()=>navigate(-1)}>
          ←
        </span>

        <button className="post-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "กำลังโพสต์..." : "โพสต์"}
        </button>

        <div className="create-container">

          {/* LEFT */}
          <div className="left-form">

            <div className="box">

              <label>รูปสินค้า</label>

              {preview && (
                <img src={preview} className="preview-img"/>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
              />

              {errors.image && (
                <p className="error">{errors.image}</p>
              )}

            </div>

            <div className="box">

              <label>ชื่อสินค้า</label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
              />

              {errors.title && (
                <p className="error">{errors.title}</p>
              )}

            </div>

          </div>

          {/* CENTER */}
          <div className="box description">

            <label>รายละเอียดสินค้า</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
            />

            {errors.description && (
              <p className="error">{errors.description}</p>
            )}

          </div>

          {/* RIGHT */}
          <div className="side-form">

            <div className="box">
              <label>เวลาเริ่มประมูล</label>
              <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
              />
              {errors.start_time && <p className="error">{errors.start_time}</p>}
            </div>

            <div className="box">
              <label>เวลาปิดประมูล</label>
              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
              />
              {errors.end_time && <p className="error">{errors.end_time}</p>}
            </div>

            <div className="box">
              <label>ราคาเริ่มต้น</label>
              <input
                name="starting_price"
                type="number"
                min="1"
                step="1"
                value={form.starting_price}
                onChange={handleChange}
              />
              {errors.starting_price && <p className="error">{errors.starting_price}</p>}
            </div>

            <div className="box">
              <label>เพิ่มราคาทีละ</label>
              <input
                name="bid_increment"
                type="number"
                min="1"
                step="1"
                value={form.bid_increment}
                onChange={handleChange}
              />
              {errors.bid_increment && <p className="error">{errors.bid_increment}</p>}
            </div>

            <div className="box">
              <label>หมวดหมู่</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="category-select"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                <option value="ของสะสม">ของสะสม</option>
                <option value="อิเล็กทรอนิกส์">อิเล็กทรอนิกส์</option>
                <option value="แฟชั่น">แฟชั่น</option>
                <option value="ศิลปะ">ศิลปะ</option>
                <option value="ยานพาหนะ">ยานพาหนะ</option>
                <option value="เครื่องประดับ">เครื่องประดับ</option>
                <option value="นาฬิกา">นาฬิกา</option>
                <option value="กีฬา">กีฬา</option>
                <option value="เครื่องใช้ไฟฟ้า">เครื่องใช้ไฟฟ้า</option>
                <option value="หนังสือ">หนังสือ</option>
                <option value="เฟอร์นิเจอร์">เฟอร์นิเจอร์</option>
                <option value="เครื่องดนตรี">เครื่องดนตรี</option>
                <option value="ของเล่น">ของเล่น</option>
                <option value="สุขภาพและความงาม">สุขภาพและความงาม</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              {errors.category && <p className="error">{errors.category}</p>}
            </div>

          </div>

        </div>

      </div>
    </>
  )
}