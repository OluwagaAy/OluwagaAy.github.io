// CV Tailor settings.
// The project URL and the publishable ("anon") key are public by design: they only
// let the browser talk to Supabase, and the database's security rules decide what
// each signed-in student may read or change.
window.CVT_CONFIG = {
  supabaseUrl: "https://fxxnqdrmankpogtuiuqe.supabase.co",
  supabaseKey: "sb_publishable_gQV1yRqkXvhnqIzQOS8srQ_vHF7bGYS",
  googleSignIn: false   // set to true once Google sign-in is switched on in Supabase
};
