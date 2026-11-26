import { PublicNav } from "../../components/PublicNav";
import { RegisterForm } from "../../components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="mark">BNI</p>
          <h1>登錄媒合資料</h1>
          <p className="sub">訪客專用，不必登入。</p>
        </div>
        <PublicNav current="register" />
      </header>
      <RegisterForm />
    </main>
  );
}
