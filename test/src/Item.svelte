<script context='module'>
    let i = 0;
    function getIndex() {
        return i++;
    }
</script>
<script>
    export let index = getIndex();
</script>

<span>{index}</span>
