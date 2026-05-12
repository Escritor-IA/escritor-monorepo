import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";

export function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    profile: "beginner",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await authApi.register(form);
      navigate("/login", { state: { message: "Conta criada com sucesso! Faça login." } });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(data)) {
          flat[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(flat);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700">Escritor.AI</h1>
          <p className="text-gray-500 mt-2">Crie sua conta gratuitamente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Criar conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuário"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              error={errors.username}
              required
              autoFocus
            />
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              required
            />
            <Input
              label="Confirmar senha"
              type="password"
              value={form.password_confirm}
              onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
              error={errors.password_confirm}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perfil de escritor
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "beginner", label: "Iniciante", desc: "Estou começando" },
                  { value: "experienced", label: "Experiente", desc: "Já publiquei obras" },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.profile === value
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value={value}
                      checked={form.profile === value}
                      onChange={() => setForm({ ...form, profile: value })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <span className="text-xs text-gray-500">{desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {errors.non_field_errors && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {errors.non_field_errors}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Criar conta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
