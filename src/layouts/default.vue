<template>
  <v-app>
    <v-main>
      <AppBar flat />
      <Suspense>
        <router-view />
      </Suspense>
      <Footer />
    </v-main>
  </v-app>
</template>
